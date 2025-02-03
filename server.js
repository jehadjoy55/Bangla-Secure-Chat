const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

const users = {}; // Stores user profiles and friends list

// Encryption function
function encryptMessage(message, key) {
    const cipher = crypto.createCipher('aes-256-ctr', key);
    return cipher.update(message, 'utf8', 'hex') + cipher.final('hex');
}

// Decryption function
function decryptMessage(encryptedMessage, key) {
    const decipher = crypto.createDecipher('aes-256-ctr', key);
    return decipher.update(encryptedMessage, 'hex', 'utf8') + decipher.final('utf8');
}

// Add route for root path
app.get('/', (req, res) => {
    res.send('Welcome to Bangla Secure Chat Backend!');
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // User profile creation
    socket.on('createProfile', ({ userId, username }) => {
        users[userId] = { username, friends: [] };
        console.log(`Profile created: ${username} (${userId})`);
        socket.emit('profileCreated', users[userId]);
    });

    // Add friend system
    socket.on('addFriend', ({ userId, friendId }) => {
        if (users[userId] && users[friendId]) {
            users[userId].friends.push(friendId);
            users[friendId].friends.push(userId);
            console.log(`${users[userId].username} added ${users[friendId].username} as a friend`);
            socket.emit('friendAdded', users[userId]);
        }
    });

    // Chat message handling
    socket.on('message', ({ encryptedMessage, key, sender, receiver }) => {
        const decryptedMessage = decryptMessage(encryptedMessage, key);
        console.log(`Message from ${sender} to ${receiver}: ${decryptedMessage}`);
        io.to(receiver).emit('message', { encryptedMessage, key, sender });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
