require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { userDb } = require('../databases/databases');
const { cookiesSetup, isAdmin } = require('./middleware');
const { publicFilesPath } = require('./middleware');

function generateAccessToken(User) {
    return jwt.sign({ username: User.username, role: User.role }, process.env.ACCESS_TOKEN, {expiresIn: '10m'});
}

function generateRefreshToken(User) {
    return jwt.sign({ username: User.username, role: User.role }, process.env.REFRESH_TOKEN);
}

//REGISTER ROUTE
router.get('/register', (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/register.html');
});

//REGISTER ROUTE
router.get('/login', (req, res) => {
    res.status(200).sendFile(publicFilesPath + '/html/login.html');
});

//Register route
router.post('/register', async (req, res) => {
    if(!req.body) return res.status(400).json({success: false, message: "Request does not provide body"});
    
    const { email, password, username } = req.body;
    if(!email || !password || !username) return res.status(400).json({success: false, message: "Invalid request body"});
    
    try {
        const isPasswordOk = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        const isAdmin = process.env.ADMIN_EMAIL == email && isPasswordOk;
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = isAdmin? 'admin' : 'user';
        const user = { email, role, username, password: hashedPassword };
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        userDb.prepare('INSERT INTO users (email, password, username, banned, role) VALUES (?, ?, ?, ?, ?)').run(email, hashedPassword, username, 0, role);
        
        cookiesSetup(res, accessToken, refreshToken, username, role);
        res.status(201).json({success: true, message: "User created successfuly"});
    }
    catch (err) {
        
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            if(err.message.includes('users.email')) return res.status(400).json({ success: false, message: 'Email already registered.'});
            else if(err.message.includes('users.username')) return res.status(400).json({success: false, message: 'Username already taken.'});
        }
        res.status(500).json({success: true, message: "Something went wrong when tryig to register. Please try again"});
        console.error(err);
    }
});

//Login route
router.post('/login', async (req, res) => {
    if(!req.body) return res.status(400).json({success: false, message: "Request does not provide body"});
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({success: false, message: "Invalid request body"});

    const user = userDb.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if(!user) return res.status(400).json({success: false, message: "User not found"});
    
    try {
        const result = await bcrypt.compare(password, user.password);
        if(!result) return res.status(401).json({success: false, message: "Invalid email and password combination"});

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        cookiesSetup(res, accessToken, refreshToken, user.username, user.role);
        res.status(201).json({success: true, message: "User logged in successfuly"});
    } 
    catch(err) {
        res.status(500).json({success: false, message: "Something went wrong"});
        console.error(err);
    }
});

//Logout route
router.post('/logout', (req, res) => {
    const accessToken = req.cookies.accessToken;
    const username = req.cookies.username;

    if(!accessToken || !username) return res.status(400).json({success: false, message: "Could not log out. Please try again."});
    try {
        for(const cookieName in req.cookies) {
            res.clearCookie(cookieName);
        }
        return res.status(200).json({success: true, message: "Cookies successfully cleared."});
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({success: false, message: "Server Error. Please try reconnecting."});
    }
});


//get loggin status 
router.get('/loginStatus', (req, res) => {
    if(!req.cookies) return res.status(200).json({isLoggedIn: false, message: 'No cookies provided.'});
    const accessToken = req.cookies.accessToken;
    const username = req.cookies.username;

    if(!accessToken || !username) return res.status(200).json({isLoggedIn: false});
    
    try {
        const user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if(!user) return res.status(200).json({isLoggedIn: false});

        jwt.verify(accessToken, process.env.ACCESS_TOKEN, (err, user) => {
            if(err) {
                if(err.name == 'TokenExpiredError') {
                return res.status(401).json({success: false, message: 'Expired access token provided'});
                }
            }
            else {
                return res.status(200).json({isLoggedIn: true});
            }
        });
    }
    catch(err) {
        console.error(err);
    }
});

//get admin status route
router.get('/adminStatus', (req, res) => {
    if(!req.cookies) return res.status(200).json({isAdmin: false, message: 'No cookies provided.'});
    const accessToken = req.cookies.accessToken;
    let role = null;

    if(!accessToken) return res.status(200).json({isAdmin: false, message: 'No access token provided.'});
    try {
        jwt.verify(accessToken, process.env.ACCESS_TOKEN, (err, user) => {
            if(err) {
                if(err.name == 'TokenExpiredError') {
                return res.status(401).json({success: false, message: 'Expired access token provided'});
                }
            }
            else {
                role = user.role;
            }

            if(role == 'admin') return res.status(200).json({isAdmin: true});
            else return res.status(200).json({isAdmin: false});
        });
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({success: false, message: 'Something went wrong. Please try logging in again.'});
    }
});

//refresh tokens route
router.get('/tokens', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) return res.status(400).json({success: false, message: 'No refresh token provided, please try loggin in again.', isLoggedIn: false});

    try {
        const rToken = userDb.prepare('SELECT * FROM bannedRefreshTokens WHERE value = ?').get(refreshToken);
        if(rToken) return res.status(400).json({success: false, message: "Already used refresh token provided, please try logging in again.", isLoggedIn: false});
        
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
            if(err) {
                console.error(err);
                return res.status(400).json({success: false, message: "Invalid refresh token provided, please try logging in again.", isLoggedIn: false});
            }
            userDb.prepare('INSERT INTO bannedRefreshTokens (value) VALUES (?)').run(refreshToken);
            const accessToken = generateAccessToken(user);
            const newRefreshToken = generateRefreshToken(user);
            
            cookiesSetup(res, accessToken, newRefreshToken, user.username, user.role);
            return res.status(200).json({success: true, message: 'Tokens refreshed successfully.', isLoggedIn: true, tokenRefreshed: true});
        });
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({success: false, message: 'Something went wrong when trying to refresh tokens. Please try again.', isLoggedIn: false});
    }
});

module.exports = router;