import { loadPosts, initSubmitPostBtn, initMorePostsBtn } from './apis.js';
import { initModals, dynamicHamburgerBtn, dynamicAuthBtns } from './dynamicUI.js';

const socket = io();

document.addEventListener('DOMContentLoaded', () => {

    //dynamic UI
    dynamicAuthBtns();
    dynamicHamburgerBtn();

    //init UI
    initModals();
    initSubmitPostBtn();
    initMorePostsBtn();

    //initial Posts load when entering the page
    loadPosts();
});

socket.on('new post', () => {
    loadPosts();
});
socket.on('new reply', () => {
    loadPosts();
});
socket.on('new vote', () => {
    loadPosts();
});
socket.on('new user banned', () => {
    loadPosts();
});
socket.on('new user unbanned', () => {
    loadPosts();
});
socket.on('new post deleted', () => {
    loadPosts();
});
socket.on('new reply deleted', () => {
    loadPosts();
});