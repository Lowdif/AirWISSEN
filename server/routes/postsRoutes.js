require('dotenv').config();
const express = require('express');
const { db } = require('../databases/databases');
const { userDb } = require('../databases/databases');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { authantificateToken } = require('./middleware');
const { verifyBanStatus } = require('./middleware');

//GET POSTS ROUTE
router.get('/:numberOfPosts', (req, res) => {
    let numberOfPosts = req.params.numberOfPosts || 10;
    let currentUser = null;
    let banStatus = null;
    if(!req.cookies) return res.status(400).json({success: false, message: 'No cookies provided, please try logging in again.'});
    const accessToken = req.cookies.accessToken;
    if(accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
            if(decoded) currentUser = decoded.username;
        }
        catch(err) {
            if(err.name == 'TokenExpiredError') {
                return res.status(401).json({success: false, message: 'Expired access token provided. Please try reloading the page.'});
            }
            console.error(err);
        }
    }
    try {
        let posts = null;
        let isAllPosts = false;
        const totalNumberOfPosts = db.prepare('SELECT COUNT(*) AS total FROM posts').get();
        
        if(numberOfPosts == 'all' || numberOfPosts >= totalNumberOfPosts.total) {
            posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all();
            isAllPosts = true;
        } else {
            posts = db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT ?').all(numberOfPosts);
        }
        
        const detailedPosts = posts.map(post => {
            let isSelfPost = false;
            const user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(post.author_username);
            if(user) banStatus = user.banned == 1? 'banned' : 'unbanned';
            const Replies = db.prepare('SELECT * FROM replies WHERE post_id = ?').all(post.id);
            detailedReplies = Replies.map(reply => {
                    const isSelfReply = false;
                    const author = userDb.prepare('SELECT * FROM users WHERE username = ?').get(reply.author_username);
                    const authorBanStatus = author.banned == 1? 'banned' : 'unbanned';
                    return {...reply, isSelf: isSelfReply, authorBanStatus };
            });
            const votes = db.prepare('SELECT * FROM votes WHERE post_id = ?').all(post.id);
            
            //post upvotes and downvotes
            let upVotes = 0, downVotes = 0;
            for (const vote of votes) {
                if(vote.vote_value === 1) upVotes += 1;
                if(vote.vote_value === -1) downVotes += 1;
            }

            //user's vote (if there is a user)
            let user_vote = 0;
            if(currentUser != null) {
                isSelfPost = currentUser == user.username;
                detailedReplies.forEach(reply => {
                    reply.isSelf = currentUser == reply.author_username;
                });
                const tempUserVote = db.prepare('SELECT vote_value FROM votes WHERE author_username = ? AND post_id = ?').get(currentUser, post.id);
                if(tempUserVote) user_vote = tempUserVote.vote_value;
            }
            return { ...post, replies: detailedReplies, upVotes, downVotes, user_vote, banStatus, isSelf: isSelfPost };
        });

        return res.status(200).json({ detailedPosts, isAllPosts });
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({success: false, message: "Server Error"});
    }
});

//GET POPULAR POSTS AND USERS ROUTE
router.get('/populars/:limit', (req, res) => {
    let limit = req.params.limit || 10;

    if(limit == 'all') limit = 10;
    else if(limit > 10 || limit < 1) limit = 10;
    
    try {     
        //popular posts
        const posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all();
        const detailedPosts = posts.map(post => {
            const votes = db.prepare('SELECT * FROM votes WHERE post_id = ?').all(post.id);
            
            let upVotes = 0, downVotes = 0;
            for (const vote of votes) {
                if(vote.vote_value === 1) upVotes += 1;
                if(vote.vote_value === -1) downVotes += 1;
            }

            return { ...post, upVotes, downVotes };
        });
        detailedPosts.sort((a, b) => ((b.upVotes || 0) - (b.downVotes || 0)) - ((a.upVotes || 0) - (a.downVotes || 0)));

        //popular users
        const scores = {};
        detailedPosts.forEach(post => {
            scores[post.author_username] = (scores[post.author_username] || 0) + ((post.upVotes || 0) - (post.downVotes || 0));
        });

        const popularUsers = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, limit);
        const popularPosts = detailedPosts.slice(0, limit);
        return res.status(200).json({popularPosts, popularUsers});
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({success: false, message: "Server Error"});
    }
});

//POST SOMETHING ON HOMEPAGE ROUTE
router.post('/', [authantificateToken, verifyBanStatus], (req, res) => {
    const { postContent } = req.body;
    const { username } = req.user;
    const userStatus = req.userStatus;

    if(userStatus == null) return res.status(400).json({success: false, message: "User status could not be determined."});
    if(userStatus == 'banned') return res.status(403).json({success: false, message: "This user is banned.", banned: true});
    if(postContent == null) return res.status(400).json({success: false, message: "Invalid request body."});
    if(username == null) return res.status(400).json({success: false, message: "Request does not provide username."});

    const timestamp = new Date().toISOString();
    try {
        db.prepare('INSERT INTO posts (author_username, content, timeStamp) VALUES (?, ?, ?)').run(username, postContent, timestamp);
        res.status(201).json({success: true, message: "Post created successfully"});
    }
    catch(err) {
        res.status(400).json({success: false, message: "Server failed to create post."});
        console.error(err);
    }
});

//REPLY ROUTE
router.post('/:postID/reply', [authantificateToken, verifyBanStatus], (req, res) => {
    const { postID } = req.params;
    const { content } = req.body
    const { username } = req.user;
    const userStatus = req.userStatus;
    
    if(userStatus == null) return res.status(400).json({success: false, message: "User status could not be determined."});
    if(userStatus == 'banned') return res.status(403).json({success: false, message: "This user is banned.", banned: true});
    if(!postID || !content) return res.status(400).json({success: false, message: 'Invalid request format.'});
    if(!username || !content || !postID) return res.status(400).json({success: false, message: 'Invalid token provided.'});

    try {
        db.prepare('INSERT INTO replies (post_id, author_username, content) VALUES (?, ?, ?)').run(postID, username, content);
        res.status(201).json({success: true, message: 'Reply created successfully'});
    }
    catch(err) {
        console.error(err);
        res.status(500).json({success: false, message: 'Server Error'});
    }
});

//VOTE ROUTE
router.post('/:postID/vote', [authantificateToken, verifyBanStatus], (req, res) => {
    const { username } = req.user;
    const { vote_value } = req.body;
    const { postID } = req.params;
    const userStatus = req.userStatus;

    if(userStatus == null) return res.status(400).json({success: false, message: "User status could not be determined."});
    if(userStatus == 'banned') return res.status(403).json({success: false, message: "This user is banned.", banned: true});
    if(postID == null || vote_value == null) return res.status(400).json({success: false, message: 'Invalid request'});
    if(username == null) return res.status(400).json({success: false, message: 'Invalid token provided'});
    if(![1, 0, -1].includes(vote_value)) return res.status(400).json({success: false, message: 'Invalid vote value'});

    try {
        const existingVote = db.prepare('SELECT * FROM votes WHERE post_id = ? AND author_username = ?').get(postID, username);
        if(existingVote) {
            if(vote_value === 0) {
                db.prepare('DELETE FROM votes WHERE id = ?').run(existingVote.id);
                res.status(200).json({success: true, message: 'Vote removed successfully'});
            }
            else {
                db.prepare('UPDATE votes SET vote_value = ? WHERE id = ?').run(vote_value, existingVote.id);
                res.status(200).json({success: true, message: 'Vote updated successfully'});
            }
        } 
        else {
            if(vote_value !== 0) {
                db.prepare('INSERT INTO votes (post_id, author_username, vote_value) VALUES (?, ?, ?)').run(postID, username, vote_value);
                res.status(200).json({success: true, message: 'Vote submitted successfully'});
            }
            else {
                res.status(400).json({success: false, message: 'No vote to remove'});
            }
        }
    }
    catch(err) {
        console.error(err);
        res.status(500).json({success: false, message: 'Server Error'});
    }
});

module.exports = router;