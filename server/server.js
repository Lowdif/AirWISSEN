require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const publicFilesPath = path.resolve(__dirname, '../frontend');

app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/authRoutes');
const modRoutes = require('./routes/modRoutes');
const postsRoutes = require('./routes/postsRoutes');

//Authantification and Authorization related Routes
app.use('/auth', authRoutes);

//Moderation Routes
app.use('/mod', modRoutes);

//Posts related Routes
app.use('/posts', postsRoutes);

//serve static files
app.use(express.static(publicFilesPath));

//HOMEPAGE ROUTE
app.get('/', (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/index.html');
});

//REGISTER ROUTE
app.get('/auth/register', (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/register.html');
});

//REGISTER ROUTE
app.get('/auth/login', (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/login.html');
});

app.use((req, res) => {
    res.status(404).json({sucess: false, message: `${req.method} ${req.originalUrl} route doesn't exist`});
});

app.listen(5000, () => {
    console.log("SERVER LISTENING ON PORT 5000...");
});