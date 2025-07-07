require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { userDb } = require('../databases/databases');
const { cookiesSetup } = require('./middleware');

function generateAccessToken(User) {
    return jwt.sign({ username: User.username }, process.env.ACCESS_TOKEN, {expiresIn: '30s'});
}

function generateRefreshToken(User) {
    return jwt.sign({ username: User.username }, process.env.REFRESH_TOKEN);
}

//Register route
router.post('/register', async (req, res) => {
    if(!req.body) return res.status(400).json({sucess: false, message: "Request does not provide body"});
    
    const { email, password, username } = req.body;
    if(!email || !password || !username) return res.status(400).json({sucess: false, message: "Invalid request body"});
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { email, username, password: hashedPassword };
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        userDb.prepare('INSERT INTO users (email, password, username, banned) VALUES (?, ?, ?, ?)').run(email, hashedPassword, username, 0);
        
        cookiesSetup(res, accessToken, refreshToken, username);
        res.status(201).json({sucess: true, message: "User created sucessfuly"});
    }
    catch (err) {
        
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            if(err.message.includes('users.email')) return res.status(400).json({ sucess: false, message: 'Email already registered.'});
            else if(err.message.includes('users.username')) return res.status(400).json({sucess: false, message: 'Username already taken.'});
        }
        res.status(500).json({sucess: true, message: "Something went wrong when tryig to register. Please try again"});
        console.error(err);
    }
});

//Login route
router.post('/login', async (req, res) => {
    if(!req.body) return res.status(400).json({sucess: false, message: "Request does not provide body"});
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({sucess: false, message: "Invalid request body"});

    const user = userDb.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if(!user) return res.status(400).json({sucess: false, message: "User not found"});
    
    try {
        const result = await bcrypt.compare(password, user.password);
        if(!result) return res.status(401).json({sucess: false, message: "Invalid email and password combination"});

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        cookiesSetup(res, accessToken, refreshToken, user.username);
        res.status(201).json({sucess: true, message: "User logged in sucessfuly"});
    } 
    catch(err) {
        res.status(500).json({sucess: false, message: "Something went wrong"});
        console.error(err);
    }
});

//Logout route
router.post('/logout', (req, res) => {
    const accessToken = req.cookies.accessToken;
    const username = req.cookies.username;

    if(!accessToken || !username) return res.status(400).json({sucess: false, message: "Could not log out. Please try again."});
    try {
        for(const cookieName in req.cookies) {
            res.clearCookie(cookieName);
        }
        return res.status(200).json({sucess: true, message: "Cookies successfully cleared."});
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({sucess: false, message: "Server Error. Please try reconnecting."});
    }
});


//get loggin status
router.post('/logginStatus', (req, res) => {
    if(!req.cookies) return res.status(400).json({success: false, message: 'No cookies provided, please try logging in again.'})
    const accessToken = req.cookies.accessToken;
    const username = req.cookies.username;

    if(!accessToken || !username) return res.status(200).json({isLoggedIn: false});
    
    try {
        const user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if(!user) return res.status(200).json({isLoggedIn: false});

        jwt.verify(accessToken, process.env.ACCESS_TOKEN, (err, user) => {
            if(err) {
                if(err.name == 'TokenExpiredError') {
                return res.redirect(307, 'http://localhost:5000/auth/tokens'); //redirects towards token refresh port (with code 307 to preserve req header)
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

//refresh tokens route
router.post('/tokens', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) return res.status(400).json({success: false, message: 'No refresh token provided, please try loggin in again.', isLoggedIn: false});

    try {
        const rToken = userDb.prepare('SELECT * FROM bannedRefreshTokens WHERE value = ?').get(refreshToken);
        if(rToken) return res.status(400).json({sucess: false, message: "Invalid refresh token provided, please try logging in again.", isLoggedIn: false});
        
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
            if(err) {
                console.error(err);
                return res.status(400).json({sucess: false, message: "Invalid refresh token provided, please try logging in again.", isLoggedIn: false});
            }
            userDb.prepare('INSERT INTO bannedRefreshTokens (value) VALUES (?)').run(refreshToken);
            const accessToken = generateAccessToken(user);
            const newRefreshToken = generateRefreshToken(user);
            
            cookiesSetup(res, accessToken, newRefreshToken, user.username);
            res.status(200).json({sucess: true, message: 'Tokens refreshed successfully.', isLoggedIn: true});
        });
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: 'Something went wrong when trying to refresh tokens. Please try again.', isLoggedIn: false});
    }
});

module.exports = router;