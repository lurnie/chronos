import { getDateString } from "./getDateString.js";
import { createPostElement } from "./postElement.js";
const body = document.body;

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

async function getPosts() {
    const response = await fetch(`/api/users/${params.user.username}/posts`);

    if (!response.ok) {
        throw new Error(response.status);
    }

    const json = await response.json();
    return json;
}

getPosts().then((posts) => {
    for (let post of posts) {
        let postElement = createPostElement(post.post_id, post.contents, post.username, post.date_created, params.username, params.admin, true);
        body.appendChild(postElement);
    }
});