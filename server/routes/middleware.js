const jwt = require('jsonwebtoken');

function authantificateToken(req, res, next) {
    if(!req.cookies) return res.status(400).json({success: false, message: 'No cookies provided, please try logging in again.'})
    const accessToken = req.cookies.accessToken;
    if(!accessToken)  return res.status(400).json({sucess: false, message: "Token not provided"});

    jwt.verify(accessToken, process.env.ACCESS_TOKEN, (err, user) => {
        if(err || user == null) {
            if(err.name == 'TokenExpiredError') {
                return res.redirect(307, 'http://localhost:5000/auth/tokens'); //redirects towards token refresh port (with code 307 to preserve req header)
            }
            console.error(err);
            return res.status(400).json({sucess: false, message: "Invalid token provided"});
        }
        req.user = user;
        next();
    })
}

//setup cookies
function cookiesSetup(res, accessToken, refreshToken, username) {
    res.clearCookie('acessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('username');
    res.cookie('accessToken', accessToken, {
        httpOnly: true
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true
    });
    res.cookie('username', username, {
        httpOnly: true
    });
}

module.exports = { authantificateToken, cookiesSetup };