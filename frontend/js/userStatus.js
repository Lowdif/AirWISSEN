import { fetchWithRetry } from "./apis.js";

async function isLoggedIn() { 
    const res = await fetchWithRetry('http://localhost:5000/auth/loginStatus', {
        method: 'GET',
        credentials: 'include',
    }); 

    const status = await res.json();
    if(!res.ok && status.isLoggedIn == null) {
        console.error('Something went wrong: ' + status.message);
        return;
    }

    return status.isLoggedIn;
}

async function isAdmin() {
    const res = await fetchWithRetry('http://localhost:5000/auth/adminStatus', {
        method: 'GET',
        credentials: 'include'
    });

    const status = await res.json();
    if(!res.ok) {
        console.error('Something went wrong: ' + status.message);
        return;
    }

    return status.isAdmin;
}

export { isLoggedIn, isAdmin };