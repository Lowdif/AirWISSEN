const postContainer = document.getElementById('postContainer');
const submitPostBtn = document.getElementById('submitPostButton');
const postTextArea = document.getElementById('postTextArea');
const authButtons = document.getElementById('authButtons');

async function isLoggedIn() { 
    const res = await fetch('http://localhost:5000/auth/logginStatus', {
        credentials: 'include',
        method: 'POST'
    }); 

    const status = await res.json();

    if(!res.ok && status.isLoggedIn == null) {
        console.error('Something went wrong: ' + status.message);
        return;
    }

    return status.isLoggedIn;
}

function isAdmin() {
    return true;
}

async function deletePost(post) {
    const res = await fetch(`http://localhost:5000/mod/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'adminkey': 'really_secret_admin_key'
        }
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    }
    loadPosts();
}

//STILL NEEDS WORK
async function deleteReply(post, reply) {
    const res = await fetch(`http://localhost:5000/mod/${post.id}/${reply.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'adminkey': 'really_secret_admin_key'
        }
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    }
    loadPosts();
}

async function logout() {
    const res = await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include',
    });

   if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    } 
}

async function banUser(post) {
    const res = await fetch(`http://localhost:5000/mod/ban/${post.author_username}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'adminkey': 'really_secret_admin_key'
        }
    });
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
    }
    loadPosts();
}

//JS for Hamburger Menu
const hamburgerMenu = document.getElementById('hamburgerMenu');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const hamburgerContainer = document.getElementById('hamburgerContainer');
hamburgerBtn.onclick = () => {
    hamburgerContainer.style.display = hamburgerContainer.style.display === 'none' ? 'block' : 'none';
};

//Cool UX feature that closes drop downs when clicking anywhere else
document.addEventListener('click', e => {
    if(!hamburgerMenu.contains(e.target) && hamburgerContainer.style.display === 'block') hamburgerContainer.style.display =  'none';
});

//Dynamic authButtons loading
async function dynamicAuthBtns() {
    const loggedIn = await isLoggedIn();
    if(loggedIn) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = async () => {
            await logout();
            window.location.reload();
        };
        authButtons.innerHTML = '';
        authButtons.appendChild(logoutBtn);
    }
    else {
        const loginBtn = document.createElement('button');
        const registerBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        registerBtn.textContent = 'Register';

        loginBtn.onclick = () => {
            window.location.href = 'http://localhost:5000/auth/login';
        };
        registerBtn.onclick = () => {
            window.location.href = 'http://localhost:5000/auth/register';
        };
        authButtons.innerHTML = '';
        authButtons.appendChild(loginBtn);
        authButtons.appendChild(registerBtn);
    }
}
dynamicAuthBtns();

async function loadPosts() {
    const res = await fetch('http://localhost:5000/posts', {
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
        postContainer.innerHTML = '';
        data.forEach(post => {
            const timeStamp = formatTimeStamp(new Date(post.timeStamp));
            postContainer.appendChild(createPost(post, timeStamp));
        });
        updateSidebars(data);
    }
    catch(err) {
        console.error(err);
        alert('Something went wrong when trying to load the page. Please try again.')
    }
}

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

function createPost(post, timeStamp) {

    const postEl = document.createElement('article');
    const postHeader = document.createElement('div');
    const postMeta = document.createElement('div');
    const actions = document.createElement('div');
    const replyBox = document.createElement('div');
    const repliesDiv = document.createElement('div');
    const upVoteBtn = document.createElement('button');
    const downVoteBtn = document.createElement('button');
    const replyBtn = document.createElement('button');
    const submitReplyBtn = document.createElement('button');
    const replyTextArea = document.createElement('textarea');
    const voteCount = document.createElement('span');
    const postTimeStamp = document.createElement('span');
    const postAuthor = document.createElement('span');
    const profilePicture = document.createElement('img');
    const postMessage = document.createElement('p');
    const like_regular = '<img class = "vote-icon" src="./icons/like-regular.svg" alt="User Icon" width="16" height="16"></img>';
    const like_solid = '<img class = "vote-icon" src="./icons/like-solid.svg" alt="User Icon" width="16" height="16"></img>';
    const dislike_regular = '<img class = "vote-icon" src="./icons/dislike-regular.svg" alt="User Icon" width="16" height="16"></img>';
    const dislike_solid = '<img class = "vote-icon" src="./icons/dislike-solid.svg" alt="User Icon" width="16" height="16"></img>';
    let voteValue = 0;

    upVoteBtn.innerHTML = like_regular;
    upVoteBtn.className = 'vote-btn';

    downVoteBtn.innerHTML = dislike_regular;
    downVoteBtn.className = 'vote-btn';

    if(post.user_vote === 1) {
        upVoteBtn.innerHTML = like_solid;
    }
    else if(post.user_vote === -1) {
        downVoteBtn.innerHTML = dislike_solid;
    }

    replyBtn.innerHTML = 'Reply';
    replyBtn.className = 'reply-btn';

    submitReplyBtn.innerHTML = 'Submit Reply';
    submitReplyBtn.className = 'submit-reply-btn';

    upVoteBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        if(post.user_vote === 1) {
            voteValue = 0;
            upVoteBtn.innerHTML = like_regular;
        }
        else {
            voteValue = 1;
            upVoteBtn.innerHTML = like_solid;
            downVoteBtn.innerHTML = dislike_regular;
        }
        await submitVote(voteValue, post.id);
        post.user_vote = voteValue;
    }

    downVoteBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        if(post.user_vote === -1) {
            voteValue = 0;
            downVoteBtn.innerHTML = dislike_regular;
        }
        else { 
            voteValue = -1;
            downVoteBtn.innerHTML = dislike_solid;
            upVoteBtn.innerHTML = like_regular;
        }
        await submitVote(voteValue, post.id);
        post.user_vote = voteValue;
    }

    replyBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        replyBox.style.display = replyBox.style.display === 'none'? 'block' : 'none';
        replyTextArea.focus();
    }
    
    submitReplyBtn.onclick = async () => {
        const loggedIn = await isLoggedIn();
        if(!loggedIn) {
            showLoginModal();
            return;
        }
        submitReply(replyTextArea.value, post.id);
    }

    replyTextArea.placeholder = "write a reply...";

    replyBox.className = 'reply-box';
    replyBox.style.display = 'none';

    repliesDiv.className = 'replies';
    post.replies.forEach(reply => {
        addReplyToUI(repliesDiv, reply.author_username, reply.content);
    });
    
    actions.className = 'post-actions';

    voteCount.className = 'vote-count';
    voteCount.textContent = ((post.upVotes || 0) - (post.downVotes || 0)).toString();

    postEl.className = 'post';
    postHeader.className = 'post-header';
    postMeta.className = 'post-meta';

    postMessage.className = 'post-message';
    postMessage.textContent = post.content;

    postTimeStamp.className = 'post-time-stamp';
    postTimeStamp.textContent = timeStamp;

    postAuthor.className = 'post-author';
    postAuthor.textContent = post.author_username;

    profilePicture.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(post.author_username)}`;
    profilePicture.alt = 'Profile picture';
    profilePicture.className = 'profile-picture';

    if(isAdmin()) {
        const moreContainer = document.createElement('div');
        const moreOptions = document.createElement('div');
        const removePostBtn = document.createElement('button');
        const banUserBtn = document.createElement('button');
        const moreBtn = document.createElement('button');
        const moreIcon = '<img class = "more-icon" src="./icons/more.svg" alt="User Icon" width="8" height="16"></img>';
        moreContainer.className = 'more-container';
        removePostBtn.textContent = 'Remove Post';
        removePostBtn.onclick = () => {
            deletePost(post);
        }
        banUserBtn.textContent = 'Ban User';
        banUserBtn.onclick = () => {
            banUser(post);
        }
        moreOptions.className = 'more-options';
        moreOptions.appendChild(removePostBtn);
        moreOptions.appendChild(banUserBtn);
        moreOptions.style.display = 'none';
        moreBtn.className = 'more-btn';
        moreBtn.innerHTML = moreIcon;
        moreBtn.onclick = () => {
            moreOptions.style.display = moreOptions.style.display == 'none' ? 'block' : 'none';
        };
        moreContainer.appendChild(moreBtn);
        moreContainer.appendChild(moreOptions);
        postHeader.appendChild(moreContainer);
        document.addEventListener('click', e => {
            if(!moreContainer.contains(e.target) && moreOptions.style.display === 'block') moreOptions.style.display =  'none';
        });
    }

    actions.appendChild(upVoteBtn);
    actions.appendChild(voteCount);
    actions.appendChild(downVoteBtn);
    actions.appendChild(replyBtn);

    replyBox.appendChild(replyTextArea);
    replyBox.appendChild(submitReplyBtn);

    postMeta.appendChild(postAuthor);
    postMeta.appendChild(postTimeStamp);

    postHeader.appendChild(profilePicture);
    postHeader.appendChild(postMeta);

    postEl.appendChild(postHeader);
    postEl.appendChild(postMessage);
    postEl.appendChild(actions);
    postEl.appendChild(replyBox);
    postEl.appendChild(repliesDiv);

    return postEl;
}

async function submitPost() {
    //work with server to refresh access token if expired
    const postContent = postTextArea.value;
    if(!postContent) return;

    submitPostBtn.disabled = true;
    try {
        await fetch('http://localhost:5000/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ postContent })
        });
        postTextArea.value = '';
        loadPosts();
    }
    catch(err) {
        console.log(err);
    }
    finally {
        submitPostBtn.disabled = false;
    }
}

async function submitVote(vote_value, post_id) {
    //same
    try {
        const res = await fetch(`http://localhost:5000/posts/${post_id}/vote`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vote_value })
        })
        if(!res.ok) {
            const msg = await res.text();
            console.error(msg);
        }
        loadPosts();
    }
    catch(err) {
        console.error(err);
    }
}

async function submitReply(content, post_id) {
    //same
    try {
        const res = await fetch(`http://localhost:5000/posts/${post_id}/reply`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({content})
        });
        if(!res.ok) {
            const msg = await res.text();
            console.error('Something went wrong: ' + msg)
        }
        loadPosts();
    }
    catch(err) {
        console.error(err);
    }
}

function addReplyToUI(container, author, text) {
  const reply = document.createElement('div');
  reply.className = 'reply';
  reply.role = 'comment';

  const strong = document.createElement('strong');
  strong.textContent = `${author}: `;

  reply.appendChild(strong);
  reply.appendChild(document.createTextNode(text));

  container.appendChild(reply);
}

function updateSidebars(posts) {
    try {
        const popularPostsList = document.getElementById('popularPostsList');
        const topUsersList = document.getElementById('topUsersList');

        //Popular posts list
        if(!popularPostsList || !topUsersList) throw new Error('Failed to load side bar, please try again');
        const populars = [...posts]
        .sort((a, b) => ((b.upVotes || 0) - (b.downVotes || 0)) - ((a.upVotes || 0) - (a.downVotes || 0)))
        .slice(0, 5);

        popularPostsList.innerHTML = '';
        populars.forEach(popular => {
            const strong = document.createElement('strong');
            const p = document.createElement('p');
            const div = document.createElement('div');
            const popularPost = document.createElement('div');
            popularPost.className = 'popular-post';
            strong.textContent = `${popular.author_username}`;
            p.textContent = `${popular.content.slice(0, 70)}${popular.content.length > 70 ? '...' : ''}`;
            div.textContent = `${(popular.upVotes || 0) - (popular.downVotes || 0)}`;
            popularPost.appendChild(strong);
            popularPost.appendChild(p);
            popularPost.appendChild(div);
            popularPostsList.appendChild(popularPost);
        });      
        
        //Top user list
        const scores = {};
        posts.forEach(post => {
            scores[post.author_username] = (scores[post.author_username] || 0) + ((post.upVotes || 0) - (post.downVotes || 0));
        });

        topUsersList.innerHTML = '';
        const topUsers = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
        topUsers.forEach(topUser => {
            const li = document.createElement('li');
            li.textContent = `${topUser[0]} (${topUser[1]} total likes)`;
            topUsersList.appendChild(li);
        });
    }
    catch(err) {
        console.error(err);
        alert('Something went wrong when trying to load the side bar, please trying logging in again.')
    }
}

function formatTimeStamp(timeStamp) {
    const now = new Date();
    const time = Math.floor((now - timeStamp) / 1000)
    const timeIntervals = [
        { interval: 'year', seconds: 31536000 },
        { interval: 'month', seconds: 2628000 },
        { interval: 'week', seconds: 604800 },
        { interval: 'day', seconds: 86400 },
        { interval: 'hour', seconds: 3600 },
        { interval: 'minute', seconds: 60 },
        { interval: 'second', seconds: 1},
    ];
    for( const timeInterval of timeIntervals) {
        const quotient = Math.floor(time / timeInterval.seconds);
        if(quotient > 0) {
            return `${quotient} ${timeInterval.interval}${quotient > 1 ? 's' : ''} ago`
        }
    };
    return 'just now';
}

// Login modal logic
const loginModal = document.getElementById('loginModal');
const loginBtn2 = document.getElementById('loginBtn2');
const registerBtn2 = document.getElementById('registerBtn2');
const closeModalBtn = document.getElementById('closeModalBtn');

function showLoginModal() { loginModal.style.display = 'flex'; }
function hideLoginModal() { loginModal.style.display = 'none'; }

loginBtn2.addEventListener('click', () => { hideLoginModal(); window.location.href = 'http://localhost:5000/auth/login'; });
registerBtn2.addEventListener('click', () => { hideLoginModal(); window.location.href = 'http://localhost:5000/auth/register'; });
closeModalBtn.addEventListener('click', hideLoginModal);
loginModal.addEventListener('click', e => { if (e.target === loginModal) hideLoginModal(); });

//initial Posts load when entering the page
loadPosts();