const popularPostsContainer = document.getElementById('popularPostsContainer');
const popularUsersContainer = document.getElementById('popularUsersContainer');
const loadedPopulars = 10;

async function loadPopulars() {
    if(!popularPostsContainer || !popularUsersContainer) return;
    const res = await fetch(`http://localhost:5000/posts/populars/${loadedPopulars}`);
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong' + msg);
        return;
    }
    try {
        const data = await res.json();
        const popularUsers = data.popularUsers;
        const popularPosts = data.popularPosts;
        popularPostsContainer.innerHTML = '';
        popularUsersContainer.innerHTML = '';
        for(const popularPost of popularPosts) {
            popularPostsContainer.appendChild(createPopularPost(popularPost));
        }
        for(const popularUser of popularUsers) {
            popularUsersContainer.appendChild(createPopularUser(popularUser));
        }
    }
    catch(err) {
        console.error(err);
    }
}

function createPopularPost(popularPost) {
    const popularContainer = document.createElement('div');
    const postHeader = document.createElement('div');
    const popularUsername = document.createElement('p');
    const profilePicture = document.createElement('img');
    const popularContent = document.createElement('div');
    const postInfoContainer = document.createElement('div');
    const totalLikes = document.createElement('p');

    profilePicture.className = 'profile-picture';
    profilePicture.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(popularPost.author_username)}`;

    popularUsername.className = 'popular-post-username';
    popularUsername.innerText = popularPost.author_username;

    popularContent.className = 'popular-post-content';
    popularContent.textContent = popularPost.content;

    totalLikes.className = 'popular-post-likes';
    const likes = (popularPost.upVotes || 0) - (popularPost.downVotes || 0);
    totalLikes.textContent = `Total likes: ${likes}`;

    postHeader.className = 'popular-post-header';
    postHeader.appendChild(profilePicture);
    postHeader.appendChild(popularUsername);
    
    postInfoContainer.appendChild(postHeader);
    postInfoContainer.appendChild(popularContent);

    popularContainer.className = 'popular-post';
    popularContainer.appendChild(postInfoContainer);
    popularContainer.appendChild(totalLikes);

    return popularContainer;
}

function createPopularUser(popularUser) {
    const popularContainer = document.createElement('div');
    const postHeader = document.createElement('div');
    const popularUsername = document.createElement('p');
    const profilePicture = document.createElement('img');
    const popularContent = document.createElement('p');

    profilePicture.className = 'profile-picture';
    profilePicture.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(popularUser[0])}`;

    popularUsername.className = 'popular-user-username';
    popularUsername.innerText = popularUser[0];

    postHeader.className = 'popular-user-header';
    postHeader.appendChild(profilePicture);
    postHeader.appendChild(popularUsername);
    
    popularContent.className = 'popular-user-content';
    popularContent.textContent = `Total Likes: ${popularUser[1]}`;

    popularContainer.className = 'popular-user';
    popularContainer.appendChild(postHeader);
    popularContainer.appendChild(popularContent);

    return popularContainer;
}

loadPopulars();

//polling (actualizes page every minute, if user if on the page)
setInterval(() => {
    if(popularPostsContainer && popularUsersContainer) {
        loadPopulars();
    }
}, 60000);