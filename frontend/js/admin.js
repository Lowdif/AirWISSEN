const bannedContainer = document.getElementById('bannedContainer');

async function loadBans() {
    const res = await fetch('http://localhost:5000/admin/bannedUsers');
    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong' + msg);
        return;
    }
    try {
        const data = await res.json();
        const bannedUsers = data.bannedUsers;
        bannedContainer.innerHTML = '';
        for(const bannedUser of bannedUsers) {
            bannedContainer.appendChild(createBans(bannedUser));
        }
    }
    catch(err) {
        console.error(err);
    }
}

async function unbanUser(username) {
    const res = await fetch(`http://localhost:5000/admin/unban/${username}`, {
        method: 'POST',
        credentials: 'include' //for cookies lateron (remove if i don't use cookies for admin auth)
    });

    if(!res.ok) {
        const msg = await res.text();
        console.error('Something went wrong: ' + msg);
        return;
    }
    loadBans();
    window.location.reload();
}

function createBans(bannedUser) {
    const banContainer = document.createElement('div');
    const bannedUsername = document.createElement('p');
    const unbanBtn = document.createElement('button');
    const bannedInfo = document.createElement('div');
    const profilePicture = document.createElement('img');

    unbanBtn.className = 'unban-btn';
    unbanBtn.innerText = 'Unban User';
    unbanBtn.onclick = () => {
        unbanUser(bannedUser.username);
    };

    profilePicture.className = 'profile-picture';
    profilePicture.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(bannedUser.username)}`;

    bannedUsername.className = 'banned-username';
    bannedUsername.innerText = bannedUser.username;

    bannedInfo.className = 'banned-meta';
    bannedInfo.appendChild(profilePicture);
    bannedInfo.appendChild(bannedUsername);
    
    banContainer.className = 'ban';
    banContainer.appendChild(bannedInfo);
    banContainer.appendChild(unbanBtn);

    return banContainer;
}

loadBans();