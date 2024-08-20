import { getDateString } from "./getDateString.js";
import { createErrorElement } from "./messages.js";

const body = document.querySelector('body');
let upperReplyBox = document.querySelector('.comment-input-container');
const commentContainer = document.querySelector('.comment-container');


async function getComments(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments`);

        if (!response.ok) {
            throw new Error(response.status);
        }

        const json = await response.json();
        return json;
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

function makeSendReplyButtonFunctional(replyBox, parent=null) {
    const sendButton = replyBox.querySelector('.post-button');
    const input = replyBox.querySelector('.post-user-input')
    sendButton.addEventListener('click', async () => {
        if (input.innerText === '') {
            return;
        }
        const userInput = input.innerText;
        const response = await fetch(`/api/posts/${post.post_id}/comments`, {
            method: 'post',
            body: JSON.stringify({
                contents: userInput,
                parentId: parent
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        });
        if (response.ok) {
            input.textContent = '';
            let json = await response.json();
            const newComment = createReplyElement(json.comment_id, json.contents, json.username, json.date_created, json.user_id);
            if (json.parent_comment === null) {
                commentContainer.insertBefore(newComment, upperReplyBox.nextSibling);
            } else {
                const parentElement = document.querySelector(`#comment-${json.parent_comment}`).parentNode;
                parentElement.appendChild(newComment);
            }
        } else {
            createErrorElement(response);
        }
    });
}

function createReplyBox(parent, canDelete=true) {
    const outerWrapper = document.createElement('ul');
    const box = document.createElement('div');
    outerWrapper.appendChild(box);
    box.setAttribute('class', 'reply input-box');

    const input = document.createElement('div');
    input.setAttribute('class', 'post-user-input');
    input.setAttribute('contenteditable', 'true');

    input.ondragover = (event) => {
        // prevents the user from dragging something onto the post input
        event.preventDefault();
        event.dataTransfer.dropEffect = 'none';
    }
    input.ondragenter = (event) => {
        // prevents the cursor from flickering when attempting to drag something into the post on some browsers
        event.preventDefault();
        event.dataTransfer.dropEffect = 'none';
    }

    const sendButton = document.createElement('button');
    sendButton.setAttribute('class', 'post-button');
    sendButton.textContent = 'Send';
    box.append(input, sendButton);


    if (canDelete) {
        const cancelButton = document.createElement('button');
        cancelButton.setAttribute('class', 'post-button');
        cancelButton.textContent = 'Cancel';


        cancelButton.addEventListener('click', () => {
            outerWrapper.remove();
        });
        sendButton.addEventListener('click', () => {
            outerWrapper.remove();
        })

        box.appendChild(cancelButton);
    }

    makeSendReplyButtonFunctional(outerWrapper, parent);


    return outerWrapper;
}

function createReplyElement(id, contents, username, timestamp, userId) {
    // TODO: put this in a separate file or combine it with the post creation code?
    const box = document.createElement('div');
    box.setAttribute('class', 'reply');
    box.setAttribute('id', `comment-${id}`);

    const commentContent = document.createElement('span');
    commentContent.textContent = contents;
    commentContent.setAttribute('class', 'comment-content');
    const timestampElement = document.createElement('span');

    timestampElement.textContent = getDateString(timestamp);
    timestampElement.setAttribute('class', 'post-date');

    const usernameElement = document.createElement('div');
    usernameElement.setAttribute('class', 'post-username');
    usernameElement.textContent = username;

    const avatar = document.createElement('img');
    avatar.setAttribute('src', `/api/uploads/avatar/${userId}`);
    avatar.setAttribute('class', 'avatar small-avatar');
    avatar.onerror = () => {
        avatar.onerror = null;
        avatar.src = '/api/uploads/default.png';
    }

    const userBox = document.createElement('div');
    userBox.setAttribute('class', 'small-user-box post-user-box bottom-border');

    userBox.append(avatar);
    userBox.append(usernameElement);

    const usernameLink = document.createElement('a');
    usernameLink.setAttribute('href', `/users/${username}`);
    usernameLink.setAttribute('class', 'username-link');
    usernameLink.append(userBox);

    const dropdown = document.createElement('div');
    dropdown.setAttribute('class', 'dropdown');
    const dropdownButton = document.createElement('button');
    dropdownButton.textContent = '...';
    dropdownButton.setAttribute('class', 'dropdown-button')
    const dropdownContent = document.createElement('div');
    dropdownContent.setAttribute('class', 'content');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('class', 'dropdown-element delete-post');

    const body = document.body;

    dropdown.addEventListener('click', () => {
        if (dropdown.getAttribute('class') === 'dropdown open') {
            dropdown.setAttribute('class', 'dropdown');
        } else {
            dropdown.setAttribute('class', 'dropdown open');
        }
    });
    body.addEventListener('click', (event) => {
        const clickedElement = document.elementFromPoint(event.clientX, event.clientY);
        if (clickedElement !== dropdownButton && clickedElement !== deleteButton) {
            dropdown.setAttribute('class', 'dropdown');
        }
    });


    dropdownContent.append(deleteButton);
    dropdown.append(dropdownButton, dropdownContent)

    box.append(usernameLink, commentContent, timestampElement, dropdown);
    const outerWrapper = document.createElement('ul');
    outerWrapper.appendChild(box);

    const replyButton = document.createElement('span');

    deleteButton.addEventListener('click', async () => {
        if (username !== user.username && !user.admin) {return;}
        let confirmDelete = confirm('Are you sure you want to delete this post?');
        if (!confirmDelete) {return;}
        const response = await fetch(`/api/comments/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            dropdown.remove();
            replyButton.remove();
            box.setAttribute('class', 'reply deleted');
            outerWrapper.style['margin'] = 0;
            if (outerWrapper.nextSibling) {outerWrapper.nextSibling.style['margin-top'] = 0;}
            setTimeout(() => {outerWrapper.remove();}, 1000);
        }
    });

    if (user.userId) {
        replyButton.textContent = 'Reply';
        replyButton.setAttribute('class', 'reply-button');

        replyButton.addEventListener('click', () => {
            const replyBox = createReplyBox(id);
            if (box.nextSibling && box.nextSibling.children[0].getAttribute('class') === 'reply input-box') {return;}
            outerWrapper.insertBefore(replyBox, box.nextSibling);
        });
        box.appendChild(replyButton);
    }
    return outerWrapper;
};


makeSendReplyButtonFunctional(upperReplyBox);
await getComments(post.post_id).then((comments) => {
    if (comments === undefined) {return;}
    for (let comment of comments) {
        console.log(comment)
        const reply = createReplyElement(comment.comment_id, comment.contents, comment.username, comment.date_created, comment.user_id);

        if (comment.parent_comment === null) {
            commentContainer.insertBefore(reply, upperReplyBox.nextSibling);
        } else {
            const parent = document.querySelector(`#comment-${comment.parent_comment}`).parentNode;
            parent.appendChild(reply);
        }
    }
})