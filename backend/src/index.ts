import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import { handleSocketEvents } from './sockets/safetySocket.js';

import dotenv from 'dotenv';
dotenv.config({ override: true });

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

handleSocketEvents(io);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tourist-safety';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
