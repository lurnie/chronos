import { createPostElement } from "./postElement.js";

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
    sendButton.setAttribute('class', 'send-button');
    sendButton.textContent = 'Send';
    box.append(input, sendButton);


    if (canDelete) {
        const cancelButton = document.createElement('button');
        cancelButton.setAttribute('class', 'cancel-button');
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

function createReplyElement(id, contents, userId, timestamp) {
    const box = document.createElement('div');
    box.setAttribute('class', 'reply');
    box.setAttribute('id', `comment-${id}`);

    const commentContent = document.createElement('span');
    commentContent.textContent = contents;
    const timestampElement = document.createElement('span');
    timestampElement.textContent = timestamp.slice(0, 10);
    timestampElement.setAttribute('class', 'post-date');

    const usernameElement = document.createElement('div');
    usernameElement.setAttribute('class', 'post-username');
    usernameElement.textContent = userId;

    box.append(usernameElement, commentContent, timestampElement);
    const outerWrapper = document.createElement('ul');
    outerWrapper.appendChild(box);

    if (params.userId) {
        const replyButton = document.createElement('span');
        replyButton.textContent = 'Reply';
        replyButton.setAttribute('class', 'reply-button');

        replyButton.addEventListener('click', () => {
            const replyBox = createReplyBox(id);
            let nextSibling = box.nextSibling.children[0];;
            if (nextSibling && nextSibling.getAttribute('class') === 'reply input-box') {return;}
            outerWrapper.insertBefore(replyBox, box.nextSibling);
        });
        box.appendChild(replyButton);
    }
    return outerWrapper;
};

await getPost(params.id).then( (postData) => {
    if (postData === undefined) {
        //TODO: make a better error message
        body.innerHTML = 'Could not find post.'
        return;
    }
    const post = createPostElement(postData.post_id, postData.contents, postData.username, postData.date_created);

    body.appendChild(post);
});

let upperReplyBox ;
if (params.userId) {
    upperReplyBox = createReplyBox(null, false);
} else {
    upperReplyBox = document.createElement('div');
}
body.appendChild(upperReplyBox);

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