// HR Teams Chat - Frontend JavaScript

// ===== STATE MANAGEMENT =====
let socket = null;
let currentUser = null;
let currentRoom = 'general';
let activePoll = null;

// ===== DOM ELEMENTS =====
const elements = {
  // User setup
  usernameInput: document.getElementById('username'),
  userRoleSelect: document.getElementById('userRole'),
  setUserBtn: document.getElementById('setUserBtn'),
  changeUserBtn: document.getElementById('changeUserBtn'),
  currentUserDisplay: document.getElementById('currentUserDisplay'),
  displayName: document.getElementById('displayName'),
  displayRole: document.getElementById('displayRole'),
  userInitials: document.getElementById('userInitials'),
  
  // Screens
  welcomeScreen: document.getElementById('welcomeScreen'),
  chatScreen: document.getElementById('chatScreen'),
  
  // Chat header
  currentRoomName: document.getElementById('currentRoomName'),
  chatUserRole: document.getElementById('chatUserRole'),
  
  // Channels
  channelItems: document.querySelectorAll('.channel-item'),
  
  // Messages
  messagesList: document.getElementById('messagesList'),
  messagesContainer: document.getElementById('messagesContainer'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  composer: document.getElementById('composer'),
  
  // Poll
  newPollBtn: document.getElementById('newPollBtn'),
  pollModal: document.getElementById('pollModal'),
  closePollModal: document.getElementById('closePollModal'),
  pollQuestionInput: document.getElementById('pollQuestionInput'),
  pollOptionsInputs: document.getElementById('pollOptionsInputs'),
  addPollOption: document.getElementById('addPollOption'),
  createPollBtn: document.getElementById('createPollBtn'),
  cancelPollBtn: document.getElementById('cancelPollBtn'),
  pollPanel: document.getElementById('pollPanel'),
  pollQuestion: document.getElementById('pollQuestion'),
  pollOptions: document.getElementById('pollOptions'),
  pollStatus: document.getElementById('pollStatus'),
  closePollBtn: document.getElementById('closePollBtn')
};

// ===== INITIALIZATION =====
function init() {
  loadUserFromLocalStorage();
  setupEventListeners();
  
  if (currentUser) {
    showChatScreen();
    connectSocket();
  }
}

// ===== LOCAL STORAGE =====
function loadUserFromLocalStorage() {
  const stored = localStorage.getItem('hrChatUser');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      updateUserDisplay();
    } catch (e) {
      console.error('Failed to load user from localStorage', e);
    }
  }
}

function saveUserToLocalStorage() {
  if (currentUser) {
    localStorage.setItem('hrChatUser', JSON.stringify(currentUser));
  }
}

function clearUserFromLocalStorage() {
  localStorage.removeItem('hrChatUser');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // User setup
  elements.setUserBtn.addEventListener('click', handleSetUser);
  elements.changeUserBtn.addEventListener('click', handleChangeUser);

  elements.composer.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });
  
  // Enter key in username input
  elements.usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSetUser();
  });
  
  // Channel switching
  elements.channelItems.forEach(item => {
    item.addEventListener('click', () => {
      const room = item.dataset.room;
      switchRoom(room);
    });
  });
  
  // Message sending
   elements.sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
  });

  elements.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Poll modal
  elements.newPollBtn.addEventListener('click', openPollModal);
  elements.closePollModal.addEventListener('click', closePollModal);
  elements.cancelPollBtn.addEventListener('click', closePollModal);
  elements.createPollBtn.addEventListener('click', createPoll);
  elements.addPollOption.addEventListener('click', addPollOptionInput);
  elements.closePollBtn.addEventListener('click', closePoll);
  
  // Modal backdrop click
  elements.pollModal.querySelector('.modal-backdrop').addEventListener('click', closePollModal);
}

// ===== USER MANAGEMENT =====
function handleSetUser() {
  const name = elements.usernameInput.value.trim();
  const role = elements.userRoleSelect.value;
  
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  currentUser = { name, role };
  saveUserToLocalStorage();
  updateUserDisplay();
  showChatScreen();
  connectSocket();
}

function handleChangeUser() {
  if (socket) {
    socket.disconnect();
  }
  
  currentUser = null;
  clearUserFromLocalStorage();
  
  elements.usernameInput.value = '';
  elements.userRoleSelect.value = 'Employee';
  
  showWelcomeScreen();
  updateUserDisplay();
}

function updateUserDisplay() {
  if (currentUser) {
    elements.displayName.textContent = currentUser.name;
    elements.displayRole.textContent = currentUser.role;
    elements.chatUserRole.textContent = currentUser.role;
    
    // Set initials
    const initials = currentUser.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    elements.userInitials.textContent = initials;
    
    // Show/hide appropriate sections
    document.querySelector('.profile-card').style.display = 'none';
    elements.currentUserDisplay.style.display = 'flex';
    
    // Enable/disable poll button based on role
    elements.newPollBtn.disabled = currentUser.role !== 'HR';
  } else {
    document.querySelector('.profile-card').style.display = 'flex';
    elements.currentUserDisplay.style.display = 'none';
    elements.newPollBtn.disabled = true;
  }
}

function showWelcomeScreen() {
  elements.welcomeScreen.style.display = 'flex';
  elements.chatScreen.style.display = 'none';
}

function showChatScreen() {
  elements.welcomeScreen.style.display = 'none';
  elements.chatScreen.style.display = 'flex';
}

// ===== SOCKET.IO CONNECTION =====
function connectSocket() {
  if (!currentUser) return;
  
  socket = io();
  
  socket.on('connect', () => {
    console.log('Connected to server');
    joinRoom(currentRoom);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  socket.on('message', handleIncomingMessage);
  socket.on('poll:active', handlePollActive);
  socket.on('poll:update', handlePollUpdate);
  socket.on('error', handleSocketError);
}

// ===== ROOM MANAGEMENT =====
function switchRoom(room) {
  if (room === currentRoom) return;
  
  currentRoom = room;
  
  // Update UI
  elements.channelItems.forEach(item => {
    item.classList.toggle('active', item.dataset.room === room);
  });
  
  elements.currentRoomName.textContent = room;
  
  // Clear messages and poll
  elements.messagesList.innerHTML = '';
  hidePollPanel();
  activePoll = null;
  
  // Update composer state
  updateComposerState();
  
  // Join room on server
  if (socket && socket.connected) {
    joinRoom(room);
  }
}

function joinRoom(room) {
  socket.emit('joinRoom', { room, user: currentUser });
  socket.emit('poll:get', { room });
}

function updateComposerState() {
  const isHROnly = currentRoom === 'hr-announcements';
  const isNonHR = currentUser.role !== 'HR';
  
  if (isHROnly && isNonHR) {
    elements.composer.classList.add('disabled');
    elements.messageInput.disabled = true;
    elements.sendBtn.disabled = true;
    elements.messageInput.placeholder = 'Only HR can post in this channel';
  } else {
    elements.composer.classList.remove('disabled');
    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.messageInput.placeholder = 'Type a message';
  }
}

// ===== MESSAGING =====
function sendMessage() {
  const text = elements.messageInput.value.trim();
  
  if (!text || !socket || !currentUser) return;
  
  socket.emit('chatMessage', {
    room: currentRoom,
    text,
    user: currentUser
  });
  
  elements.messageInput.value = '';
}

function handleIncomingMessage(message) {
  const messageEl = createMessageElement(message);
  elements.messagesList.appendChild(messageEl);
  scrollToBottom();
}

function createMessageElement(message) {
  const div = document.createElement('div');
  div.className = 'message';
  div.dataset.testid = `message-${Date.now()}`;

  // Get initials for avatar
  const initials = message.user
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Avatar class based on role
  const avatarClass = message.role === 'system' ? 'system' : message.role === 'HR' ? 'hr' : '';

  // Role badge class
  const roleClass = message.role === 'system' ? 'system' : message.role === 'HR' ? 'hr' : '';

  // Format timestamp
  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  // Check if message is a command
  const isCommand = message.text.startsWith('/');
  const commandChip = isCommand ? '<span class="command-chip">Command</span>' : '';

  // Spotify embed detection
  let content = message.text;
  const spotifyRegex = /https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;
  const match = message.text.match(spotifyRegex);

  if (match) {
    const type = match[1];
    const id = match[2];
    const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
    content = `<iframe src="${embedUrl}" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
  } else {
    content = escapeHtml(message.text);
  }

  div.innerHTML = `
    <div class="message-avatar ${avatarClass}">${initials}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">${message.user}</span>
        <span class="message-role ${roleClass}">${message.role}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">
        ${commandChip}${content}
      </div>
    </div>
  `;

  return div;
}

function scrollToBottom() {
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== POLL MANAGEMENT =====
function openPollModal() {
  if (currentUser.role !== 'HR') return;
  
  elements.pollModal.style.display = 'flex';
  elements.pollQuestionInput.value = '';
  
  // Reset to 2 options
  elements.pollOptionsInputs.innerHTML = `
    <input type="text" class="form-input poll-option-input" placeholder="Option 1" data-testid="input-poll-option-0" />
    <input type="text" class="form-input poll-option-input" placeholder="Option 2" data-testid="input-poll-option-1" />
  `;
}

function closePollModal() {
  elements.pollModal.style.display = 'none';
}

function addPollOptionInput() {
  const optionInputs = elements.pollOptionsInputs.querySelectorAll('.poll-option-input');
  const nextIndex = optionInputs.length;
  
  if (nextIndex >= 6) {
    alert('Maximum 6 options allowed');
    return;
  }
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input poll-option-input';
  input.placeholder = `Option ${nextIndex + 1}`;
  input.dataset.testid = `input-poll-option-${nextIndex}`;
  
  elements.pollOptionsInputs.appendChild(input);
}

function createPoll() {
  const question = elements.pollQuestionInput.value.trim();
  const optionInputs = elements.pollOptionsInputs.querySelectorAll('.poll-option-input');
  const options = Array.from(optionInputs)
    .map(input => input.value.trim())
    .filter(val => val !== '');
  
  if (!question) {
    alert('Please enter a question');
    return;
  }
  
  if (options.length < 2) {
    alert('Please enter at least 2 options');
    return;
  }
  
  // Include user for server-side authorization
  socket.emit('poll:create', {
    room: currentRoom,
    question,
    options,
    user: currentUser
  });
  
  closePollModal();
}

function handlePollActive(poll) {
  activePoll = poll;
  renderPoll();
}

function handlePollUpdate(poll) {
  activePoll = poll;
  renderPoll();
}

function renderPoll() {
  if (!activePoll) {
    hidePollPanel();
    return;
  }
  
  elements.pollPanel.style.display = 'block';
  elements.pollQuestion.textContent = activePoll.question;
  
  // Calculate total votes
  const totalVotes = activePoll.options.reduce((sum, opt) => sum + opt.votes, 0);
  
  // Render options
  elements.pollOptions.innerHTML = '';
  activePoll.options.forEach((option, index) => {
    const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100) : 0;
    const hasVoted = currentUser && option.voters.includes(currentUser.name);
    const isDisabled = activePoll.isClosed;
    
    const optionEl = document.createElement('div');
    optionEl.className = `poll-option ${hasVoted ? 'voted' : ''} ${isDisabled ? 'disabled' : ''}`;
    optionEl.dataset.testid = `poll-option-${index}`;
    
    if (!isDisabled) {
      optionEl.style.cursor = 'pointer';
      optionEl.addEventListener('click', () => votePoll(index));
    }
    
    optionEl.innerHTML = `
      <div class="poll-option-content">
        <span class="poll-option-label">${escapeHtml(option.label)}</span>
        <span class="poll-option-votes">${option.votes} vote${option.votes !== 1 ? 's' : ''}</span>
      </div>
      <div class="poll-option-bar" style="width: ${percentage}%"></div>
    `;
    
    elements.pollOptions.appendChild(optionEl);
  });
  
  // Update status
  if (activePoll.isClosed) {
    elements.pollStatus.textContent = 'Closed';
    elements.pollStatus.classList.add('closed');
    elements.closePollBtn.style.display = 'none';
  } else {
    elements.pollStatus.textContent = 'Active';
    elements.pollStatus.classList.remove('closed');
    elements.closePollBtn.style.display = currentUser.role === 'HR' ? 'block' : 'none';
  }
}

function hidePollPanel() {
  elements.pollPanel.style.display = 'none';
}

function votePoll(optionIndex) {
  if (!activePoll || activePoll.isClosed || !socket) return;
  
  socket.emit('poll:vote', {
    pollId: activePoll.id,
    room: currentRoom,
    optionIndex,
    user: currentUser
  });
}

function closePoll() {
  if (!activePoll || activePoll.isClosed || !socket || currentUser.role !== 'HR') return;
  
  // Include user for server-side authorization
  socket.emit('poll:close', {
    pollId: activePoll.id,
    room: currentRoom,
    user: currentUser
  });
}

// ===== ERROR HANDLING =====
function handleSocketError(error) {
  console.error('Socket error:', error);
  alert(error.message || 'An error occurred');
}

// ===== START APPLICATION =====
init();
