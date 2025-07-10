require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const publicFilesPath = path.resolve(__dirname, '../frontend');

app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/authRoutes');
const postsRoutes = require('./routes/postsRoutes');
const adminRoutes = require('./routes/adminRoutes');

//Authantification and Authorization related Routes
app.use('/auth', authRoutes);

//Posts related Routes
app.use('/posts', postsRoutes);

//Administration page Route
app.use('/admin', adminRoutes);

//serve static files
app.use(express.static(publicFilesPath));

//HOMEPAGE ROUTE
app.get('/', async (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/index.html');
});

app.use((req, res) => {
    res.status(404).json({success: false, message: `${req.method} ${req.originalUrl} route doesn't exist`});
});

app.listen(5000, () => {
    console.log("SERVER LISTENING ON PORT 5000...");
});