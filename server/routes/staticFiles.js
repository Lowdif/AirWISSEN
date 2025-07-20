const express = require('express');
const { publicFilesPath } = require('./middleware');
const router = express.Router();
const { isAdmin } = require('./middleware');

//serve static files
router.use(express.static(publicFilesPath));

//HOMEPAGE
router.get('/', async (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/index.html');
});

//POPULARS PAGE
router.get('/populars', async (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/populars.html');
});

//ADMINS PAGE
router.get('/admin', isAdmin, (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/admin.html');
});

//REGISTER ROUTE
router.get('/register', (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/register.html');
});

//LOGIN ROUTE
router.get('/login', (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/login.html');
});

module.exports = router;