const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const users = new Map();
users.set('Joe', '123');

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('login', ({ username, password }) => {
    if (users.has(username) && users.get(username) === password) {
      connectedUsers.set(socket.id, username);
      socket.emit('login success', { username });
      io.emit('user joined', { username, userCount: connectedUsers.size });
      console.log(`${username} logged in`);
    } else {
      socket.emit('login failed', { message: 'Invalid username or password' });
    }
  });

  socket.on('register', ({ username, password }) => {
    if (users.has(username)) {
      socket.emit('register failed', { message: 'Username already exists' });
    } else {
      users.set(username, password);
      connectedUsers.set(socket.id, username);
      socket.emit('register success', { username });
      io.emit('user joined', { username, userCount: connectedUsers.size });
      console.log(`${username} registered and logged in`);
    }
  });

  socket.on('chat message', (msg) => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      io.emit('chat message', { 
        text: msg, 
        user: username,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      connectedUsers.delete(socket.id);
      io.emit('user left', { username, userCount: connectedUsers.size });
      console.log(`${username} disconnected`);
    }
  });
});

// Use Render's dynamic port
const PORT = process.env.PORT || 5000;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
