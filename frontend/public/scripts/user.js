import { getDateString } from "./getDateString.js";

const container = document.querySelector('.user-container');
const username = document.querySelector('.user-username');
username.textContent = `@${params.user.username}`;
const userJoined = document.querySelector('.user-joined');
userJoined.textContent = `Joined ${getDateString(params.user.date_created)}`;

if (params.user.admin_privileges) {
    const admin = document.createElement('div');
    admin.textContent = 'Admin';
    admin.setAttribute('class', 'user-info user-admin');
    container.appendChild(admin);
}