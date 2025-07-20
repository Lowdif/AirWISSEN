import { showBanModal, showLoginModal } from "./dynamicUI.js";
import { updateSidebars, createPost } from "./UIhandler.js";
import { isLoggedIn } from "./userStatus.js";
import { formatTimeStamp } from "./timestampFormater.js";

const postContainer = document.getElementById('postContainer');
const submitPostBtn = document.getElementById('submitPostButton');
const postTextArea = document.getElementById('postTextArea');
const morePostsBtn = document.getElementById('morePostsBtn');
let numberOfPosts = 10;
let numberOfPopulars = 5;

const socket = io();

async function submitPost() {
    const postContent = postTextArea.value;
    if(!postContent) return;

    submitPostBtn.disabled = true;
    try {
        const res = await fetchWithRetry('http://localhost:5000/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ postContent })
        });

        if(!res.ok) {
            const data = await res.json();
            if(data.banned == true) {
                showBanModal();
                return false;
            };
            console.error('Something went wrong: ' + data.message)
            return;
        }
        postTextArea.value = '';
        socket.emit('new post');
    }
    catch(err) {
        console.error(err);
    }
    finally {
        submitPostBtn.disabled = false;
    }
}

async function submitVote(vote_value, post_id) {
    try {
        const res = await fetchWithRetry(`http://localhost:5000/posts/${post_id}/vote`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vote_value })
        })
        if(!res.ok) {
            const data = await res.json();
            if(data.banned == true) {
                showBanModal();
                return false;
            };
            console.error('Something went wrong: ' + data.message)
            return;
        }
        socket.emit('new vote');
    }
    catch(err) {
        console.error(err);
    }
}

async function submitReply(content, post_id) {
    try {
        const res = await fetchWithRetry(`http://localhost:5000/posts/${post_id}/reply`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({content})
        });
        const data = await res.json();
        if(!res.ok) {
            if(data.banned == true) {
                showBanModal();
                return false;
            };
            console.error('Something went wrong: ' + data.message)
            return;
        }
        socket.emit('new reply');
    }
    catch(err) {
        console.error(err);
    }
}

async function loadPosts() {
    const res = await fetchWithRetry(`http://localhost:5000/posts/${numberOfPosts}`, {
        method: 'GET',
        credentials: 'include',
    });

    if(!res.ok) {
        const msg = await res.json();
        console.error('Something went wrong: ' + msg.message);
        alert(msg.message);
        return;
    }

    try {
        const data = await res.json();
        const posts = data.detailedPosts;
        morePostsBtn.textContent = data.isAllPosts ? 'Less...' : 'More...';
        morePostsBtn.style.display = (data.isAllPosts && posts.length <= numberOfPosts) ? 'none' : 'flex';

        postContainer.innerHTML = '';
        const end = numberOfPosts == 'all' ? posts.length : numberOfPosts;
        posts.slice(0, end).forEach(post => {
            const timeStamp = formatTimeStamp(new Date(post.timeStamp));
            postContainer.appendChild(createPost(post, timeStamp));
        });
        loadSidebars();
    }
    catch(err) {
        console.error(err);
        alert('Something went wrong when trying to load the posts. Please try again.')
    }
}

async function loadSidebars() {
    const res = await fetchWithRetry(`http://localhost:5000/posts/populars/${numberOfPopulars}`, {
        method: 'GET',
        credentials: 'include',
    });

    if(!res.ok) {
        const msg = await res.json();
        console.error('Something went wrong: ' + msg.message);
        alert(msg.message);
        return;
    }

    try {
        const data = await res.json();
        const popularPosts = data.popularPosts;
        const popularUsers = data.popularUsers;

        updateSidebars(popularPosts, popularUsers);
    }
    catch(err) {
        console.error(err);
        alert('Something went wrong when trying to load the page. Please try again.')
    }
}

async function fetchWithRetry(url, options) {
    let res = await fetch(url, options);
    if (res.status == 401) {
        const tokenRes = await fetch('http://localhost:5000/auth/tokens', {
            method: 'GET',
            credentials: 'include'
        });
        if (tokenRes.ok) {
            res = await fetch(url, options);
        } 
        else {
            const msg = await tokenRes.json();
            console.error('Something went wrong: ' + msg.message);
        }
    }
    return res;
}

function initSubmitPostBtn() {
    //disable sybmit button when textfield is empty
    postTextArea.addEventListener('input', () => {
        submitPostBtn.disabled = postTextArea.value.trim() === '';
    });

    submitPostBtn.onclick = async (e) => {
        const loggedIn = await isLoggedIn();
        e.preventDefault();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        submitPost();
    }
}

function initMorePostsBtn() {
    morePostsBtn.onclick = () => { 
        numberOfPosts = morePostsBtn.innerText == 'More...' ? 'all' : 10;
        loadPosts();
    };
}

async function logout() {
    const res = await fetchWithRetry('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include',
    });

   if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    } 
}

export { submitPost, submitReply, submitVote, loadPosts, fetchWithRetry, initSubmitPostBtn, initMorePostsBtn, logout };