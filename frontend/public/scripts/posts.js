import { createPostElement } from "./postElement.js";

const body = document.querySelector('body');

async function getPosts() {
    const response = await fetch('/api/posts');

    if (!response.ok) {
        throw new Error(response.status);
    }

    const json = await response.json();
    return json;
}

getPosts().then((posts) => {
    for (let post of posts) {
        let postElement = createPostElement(post.contents, post.date_created);
        body.appendChild(postElement);
    }
});

const sendButton = document.querySelector('#send-button');
const userInput = document.querySelector('#post-user-input');
const inputPost = document.querySelector('#post-send-box');

sendButton.addEventListener('click', async () => {
    if (userInput.textContent === '') {
        return;
    }
    const response = await fetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
            contents: userInput.textContent
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    });
    if (response.ok) {
        let json = await response.json();
        let postElement = createPostElement(json.contents, json.date_created);
        body.insertBefore(postElement, inputPost.nextSibling);
        userInput.textContent = '';
    }
});