const express = require('express');
const { db } = require('../databases/databases');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { authantificateToken } = require('./middleware');
//GET POSTS ROUTE
router.get('/', (req, res) => {
    let currentUser = null;
    if(!req.cookies) return res.status(400).json({success: false, message: 'No cookies provided, please try logging in again.'});
    const accessToken = req.cookies.accessToken;
    if(accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
            currentUser = decoded.username;
        }
        catch(err) {
            console.error(err);
        }
    }
    try {
        const posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all();
        const detailedPosts = posts.map(post => {
            const replies = db.prepare('SELECT * FROM replies WHERE post_id = ?').all(post.id);
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
                const tempUserVote = db.prepare('SELECT vote_value FROM votes WHERE author_username = ? AND post_id = ?').get(currentUser, post.id);
                if(tempUserVote) user_vote = tempUserVote.vote_value;
            }
            return { ...post, replies, upVotes, downVotes, user_vote };
        });
        res.status(200).json(detailedPosts);
    }
    catch(err) {
        console.error(err);
        res.status(500).json({sucess: false, message: "Server Error"});
    }
});

//POST SOMETHING ON HOMEPAGE ROUTE
router.post('/', authantificateToken, (req, res) => {
    const { postContent } = req.body;
    const { username } = req.user;

    if(postContent == null) return res.status(400).json({sucess: false, message: "Invalid request body."});
    if(username == null) return res.status(400).json({sucess: false, message: "Request does not provide username."});

    const timestamp = new Date().toISOString();
    try {
        db.prepare('INSERT INTO posts (author_username, content, timeStamp) VALUES (?, ?, ?)').run(username, postContent, timestamp);
        res.status(201).json({sucess: true, message: "Post created sucessfully"});
    }
    catch(err) {
        res.status(400).json({sucess: false, message: "Server failed to create post."});
        console.error(err);
    }
});

//REPLY ROUTE
router.post('/:postID/reply', authantificateToken, (req, res) => {
    const { postID } = req.params;
    const { content } = req.body
    const { username } = req.user;
    
    if(!postID || !content) return res.status(400).json({sucess: false, message: 'Invalid request format.'});
    if(!username || !content || !postID) return res.status(400).json({sucess: false, message: 'Invalid token provided.'});

    try {
        db.prepare('INSERT INTO replies (post_id, author_username, content) VALUES (?, ?, ?)').run(postID, username, content);
        res.status(201).json({sucess: true, message: 'Reply created successfully'});
    }
    catch(err) {
        console.error(err);
        res.status(500).json({sucess: false, message: 'Server Error'});
    }
});

//VOTE ROUTE
router.post('/:postID/vote', authantificateToken, (req, res) => {
    const { username } = req.user;
    const { vote_value } = req.body;
    const { postID } = req.params;

    if(postID == null || vote_value == null) return res.status(400).json({sucess: false, message: 'Invalid request'});
    if(username == null) return res.status(400).json({sucess: false, message: 'Invalid token provided'});
    if(![1, 0, -1].includes(vote_value)) return res.status(400).json({sucess: false, message: 'Invalid vote value'});

    try {
        const existingVote = db.prepare('SELECT * FROM votes WHERE post_id = ? AND author_username = ?').get(postID, username);
        if(existingVote) {
            if(vote_value === 0) {
                db.prepare('DELETE FROM votes WHERE id = ?').run(existingVote.id);
                res.status(200).json({sucess: true, message: 'Vote removed successfully'});
            }
            else {
                db.prepare('UPDATE votes SET vote_value = ? WHERE id = ?').run(vote_value, existingVote.id);
                res.status(200).json({sucess: true, message: 'Vote updated successfully'});
            }
        } 
        else {
            if(vote_value !== 0) {
                db.prepare('INSERT INTO votes (post_id, author_username, vote_value) VALUES (?, ?, ?)').run(postID, username, vote_value);
                res.status(200).json({sucess: true, message: 'Vote submitted successfully'});
            }
            else {
                res.status(400).json({sucess: false, message: 'No vote to remove'});
            }
        }
    }
    catch(err) {
        console.error(err);
        res.status(500).json({sucess: false, message: 'Server Error'});
    }
});

module.exports = router;