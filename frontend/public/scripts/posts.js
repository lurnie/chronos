import { createPostElement } from "./postElement.js";
import { createErrorElement } from "./error.js";

const body = document.querySelector('body');


document.querySelectorAll('.post').forEach((post) => {
    const dropdown = post.querySelector('.dropdown');
    if (!dropdown) {return} // this is the send post

    // hides the dropdown when you click on the button
    dropdown.addEventListener('click', () => {
        if (dropdown.getAttribute('class') === 'dropdown open') {
            dropdown.setAttribute('class', 'dropdown');
        } else {
            dropdown.setAttribute('class', 'dropdown open');
        }
    });

    const dropdownButton = dropdown.querySelector('.dropdown-button');

    // hides the dropdown when you click away
    body.addEventListener('click', (event) => {
        const clickedElement = document.elementFromPoint(event.clientX, event.clientY);
        if (clickedElement !== dropdownButton && clickedElement !== deleteButton) {
            dropdown.setAttribute('class', 'dropdown');
        }
    });

    const id = dropdown.getAttribute('id').slice(9) // removes the dropdown- from the id and only gets the id

    // deletes the post if you click it
    const deleteButton = dropdown.querySelector('.delete-post');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            let confirmDelete = confirm('Are you sure you want to delete this post?');
            if (!confirmDelete) {return;}
            const response = await fetch(`/api/posts/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                dropdown.remove();
                post.setAttribute('class', 'post deleted');
                if (post.nextElementSibling) {post.nextElementSibling.style['margin-top'] = 0;}
                setTimeout(() => {post.remove()}, 2000);
            }
        });
    }

});

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
                contents: userInput.textContent
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        });
        if (response.ok) {
            let json = await response.json();
            let postElement = createPostElement(json.post_id, json.contents, json.username, json.date_created, user.username, user.admin, true);
            body.insertBefore(postElement, inputPost.nextSibling);
            userInput.textContent = '';
        } else {
            createErrorElement(response);
        }
    });
}