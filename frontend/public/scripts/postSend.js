import { createErrorElement } from "./error.js";

if (user.userId) {
    const inputPost = document.querySelector('.post.send-box');
    const userInput = inputPost.querySelector('.post-user-input');
    const sendButton = inputPost.querySelector('.post-button')

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
                contents: userInput.innerText
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        });
        if (response.ok) {
            let json = await response.json();
            window.location.href = `/posts/${json.post_id}`;
        } else {
            createErrorElement(response);
        }
    });
}