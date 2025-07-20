require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());

//websocket setup
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

const authRoutes = require('./routes/authRoutes');
const postsRoutes = require('./routes/postsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staticFiles = require('./routes/staticFiles');

//Authantification and Authorization related Routes
app.use('/auth', authRoutes);

//Posts related Routes
app.use('/posts', postsRoutes);

//Administration page Route
app.use('/admin', adminRoutes);

//serve static files
app.use('/', staticFiles);

app.use((req, res) => {
    res.status(404).json({success: false, message: `${req.method} ${req.originalUrl} route doesn't exist`});
});

//websocket logic 
io.on('connection', (socket) => {
    socket.on('new post', () => io.emit('new post')); //broadcasts to all clients that a new post has been made
    socket.on('new vote', () => io.emit('new vote'));
    socket.on('new reply', () => io.emit('new reply'));
    socket.on('new user banned', () => io.emit('new user banned'));
    socket.on('new user unbanned', () => io.emit('new user unbanned'));
    socket.on('new post deleted', () => io.emit('new post deleted'));
    socket.on('new reply deleted', () => io.emit('new reply deleted'));
});

server.listen(5000, () => {
    console.log("SERVER LISTENING ON PORT 5000...");
});