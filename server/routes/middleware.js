require('dotenv').config();
const jwt = require('jsonwebtoken');
const path = require('path');
const { userDb } = require('../databases/databases');
const publicFilesPath = path.resolve(__dirname, '../../frontend');


function authantificateToken(req, res, next) {
    if(!req.cookies) return res.status(400).json({success: false, message: 'No cookies provided, please try logging in again.'});
    const accessToken = req.cookies.accessToken;
    if(!accessToken)  return res.status(400).json({success: false, message: "Token not provided"});

    jwt.verify(accessToken, process.env.ACCESS_TOKEN, (err, user) => {
        if(err || user == null) {
            if(err.name == 'TokenExpiredError') {
                return res.redirect(307, 'http://localhost:5000/auth/tokens'); //redirects towards token refresh port (with code 307 to preserve req header)
            }
            console.error(err);
            return res.status(400).json({success: false, message: "Invalid token provided"});
        }
        req.user = user;
        next();
    })
}

function isAdmin(req, res, next) {
    if(!req.cookies) return res.status(400).json({success: false, message: 'No cookies provided, please try logging in again.'});
    const role = req.cookies.role;
    if(!role)  return res.status(400).json({success: false, message: "No role token provided. Please try logging in again."});
    if(role !== 'admin') return res.status(403).json({success: false, message: "Access to this function is admin exclusif."});
    next();
}

function verifyBanStatus(req, res, next) {
    const {username} = req.user;
    if(!username) return res.status(400).json({success: false, message: "Request does not provide username."});

    try{
        const user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if(!user) return res.status(404).json({success: false, message: "User could not be found when verifying status."});
        if(user.banned == 1) req.userStatus = 'banned';
        else req.userStatus = 'unbanned';
        next();
    }
    catch(err) {
        console.error(err);
        return res.status(400).json({success: false, message: "Server Error. Please try logging in again"});
    }
}

//setup cookies
function cookiesSetup(res, accessToken, refreshToken, username, role) {
    res.clearCookie('acessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('username');
    res.clearCookie('role');
    res.cookie('accessToken', accessToken, {
        httpOnly: true
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true
    });
    res.cookie('username', username, {
        httpOnly: true
    });
    res.cookie('role', role, {
        httpOnly: true
    });
}

module.exports = { authantificateToken, verifyBanStatus, isAdmin, cookiesSetup, publicFilesPath };