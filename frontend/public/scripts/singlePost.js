import { createPostElement } from "./postElement.js";
import { getDateString } from "./getDateString.js";

const body = document.querySelector('body');

async function getPost(id) {
    try {
        const response = await fetch(`/api/posts/${id}`);
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

    sendButton.addEventListener('click', async () => {
        if (input.textContent === '') {
            return;
        }
        const userInput = input.textContent;
        const response = await fetch(`/api/posts/${params.id}/comments`, {
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
            const newComment = createReplyElement(json.comment_id, json.contents, json.username, json.date_created);
            if (json.parent_comment === null) {
                body.insertBefore(newComment, upperReplyBox.nextSibling);
            } else {
                const parentElement = document.querySelector(`#comment-${json.parent_comment}`).parentNode;
                parentElement.appendChild(newComment);
            }
        }
    });


    return outerWrapper;
}

function createReplyElement(id, contents, username, timestamp) {
    // TODO: put this in a separate file or combine it with the post creation code?
    const box = document.createElement('div');
    box.setAttribute('class', 'reply');
    box.setAttribute('id', `comment-${id}`);

    const commentContent = document.createElement('span');
    commentContent.textContent = contents;
    const timestampElement = document.createElement('span');

    timestampElement.textContent = getDateString(timestamp);
    timestampElement.setAttribute('class', 'post-date');

    const usernameElement = document.createElement('div');
    usernameElement.setAttribute('class', 'post-username');
    usernameElement.textContent = username;
    const usernameLink = document.createElement('a');
    usernameLink.setAttribute('href', `/users/${username}`);
    usernameLink.setAttribute('class', 'username-link');
    usernameLink.append(usernameElement);

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
        if (username !== params.username && !params.admin) {return;}
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
            setTimeout(() => {outerWrapper.remove(); console.log('hi');}, 1000);
        }
    });

    if (params.userId) {
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

let postExists = true;

await getPost(params.id).then( (postData) => {
    if (postData === undefined) {
        //TODO: make a better error message
        const error = document.createElement('div');
        error.textContent = 'Could not find post.';
        body.appendChild(error);
        postExists = false;
        return;
    }
    const post = createPostElement(postData.post_id, postData.contents, postData.username, postData.date_created, params.username, params.admin);

    body.appendChild(post);
});

let upperReplyBox ;
if (postExists) {
    if (params.userId) {
        upperReplyBox = createReplyBox(null, false);
    } else {
        upperReplyBox = document.createElement('div');
    }
    body.appendChild(upperReplyBox);
}

await getComments(params.id).then((comments) => {
    if (comments === undefined) {return;}
    for (let comment of comments) {
        const reply = createReplyElement(comment.comment_id, comment.contents, comment.username, comment.date_created);

        if (comment.parent_comment === null) {
            body.insertBefore(reply, upperReplyBox.nextSibling);
        } else {
            const parent = document.querySelector(`#comment-${comment.parent_comment}`).parentNode;
            parent.appendChild(reply);
        }
    }
})