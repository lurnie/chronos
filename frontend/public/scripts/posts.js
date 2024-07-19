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
        let postElement = createPostElement(post.post_id, post.contents, post.username, post.date_created, params.username, params.admin, true);
        body.appendChild(postElement);
    }
});

if (params.userId) {
    const inputPost = document.createElement('div');
    inputPost.setAttribute('class', 'post send-box');

    const userInput = document.createElement('div');
    userInput.setAttribute('class', 'post-user-input');
    userInput.setAttribute('contenteditable', 'true');

    const sendButton = document.createElement('button');
    sendButton.setAttribute('class', 'post-button');
    sendButton.textContent = 'Send';

    inputPost.append(userInput, sendButton);
    body.appendChild(inputPost);

    userInput.ondragover = (event) => {
        // prevents the user from dragging something onto the post input
        event.preventDefault();
        event.dataTransfer.dropEffect = 'none';
    }
    userInput.ondragenter = (event) => {
        // prevents the cursor from flickering when attempting to drag something into the post on some browsers
        event.preventDefault();
        event.dataTransfer.dropEffect = 'none';
    }

    sendButton.addEventListener('click', async () => {
        if (userInput.textContent === '') {
            return;
        }
        const response = await fetch('/api/posts', {
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
            let postElement = createPostElement(json.post_id, json.contents, json.username, json.date_created, params.username, params.admin, true);
            body.insertBefore(postElement, inputPost.nextSibling);
            userInput.textContent = '';
        }
    });
}