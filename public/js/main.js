const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages"); 
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join chatroom
socket.emit("joinRoom", { username, room });

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  outputMessage(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Typing notifications
let typingUsers = new Set();
let typingTimeout;

chatForm.elements.msg.addEventListener("input", () => {
  socket.emit("typing");
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping");
  }, 300);
});

// Listen for typing notifications
socket.on("typing", (username) => {
  typingUsers.add(username);
  outputTypingIndicators();
});

// Listen for stop typing notifications
socket.on("stopTyping", (username) => {
  typingUsers.delete(username);
  outputTypingIndicators();
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const msg = e.target.elements.msg.value;

  // Emit stop typing event
  socket.emit("stopTyping");

  // Emit message to server
  socket.emit("chatMessage", msg);

  // Emit message to the AI for processing
  socket.emit("aiMessage", msg);

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");

  // Add the username, time, and image (if available)
  div.innerHTML = `
 
  <div class="d-flex justify-content-start mt-2"><p class="meta">
      ${message.imageUrl ? `<img src="${message.imageUrl}" alt="User Icon" style="width: 40px; height: 20px; border-radius: 50%; margin-right: 2px;">` : ''}
     
    </p> <p style="background-color: #f0f0f0; padding: 5px; border-radius: 10px; margin-right: 10px;"> ${message.username} </p></div>
    
   <span class="card p-1"> <p class="text">${message.text}</p><span class="text-end">${message.time}</span></span>
  `;

  // Append the message to the chat
  document.querySelector(".chat-messages").appendChild(div);
}



// Output typing indicators to DOM
function outputTypingIndicators() {
  clearTypingIndicator(); 

  if (typingUsers.size > 0) {
    const div = document.createElement("div");
    div.classList.add("typing-indicator");
    div.innerText = Array.from(typingUsers).join(", ") + " is typing...";
    document.querySelector(".chat-messages").appendChild(div);
  }
}

// Clear typing indicator
function clearTypingIndicator() {
  const typingIndicators = document.querySelectorAll(".typing-indicator");
  typingIndicators.forEach((indicator) => indicator.remove());
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `${users
    .map((user) => `<li>${user.username}</li>`)
    .join("")}`;
}


