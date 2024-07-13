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

function createReplyBox(parent, func) {
    const box = document.createElement('div');
    box.setAttribute('class', 'reply input-box');

    const input = document.createElement('div');
    input.setAttribute('class', 'post-user-input');
    input.setAttribute('contenteditable', 'true');

    const button = document.createElement('button');
    button.setAttribute('class', 'send-button');
    button.textContent = 'Send';

    box.append(input, button);

    func(box, input, button);

    return box;
}

function createReplyElement(id, contents, timestamp, parent) {
    const box = document.createElement('div');
    box.setAttribute('class', 'reply');
    box.setAttribute('id', `comment-${id}`);

    const commentContent = document.createElement('span');
    commentContent.textContent = contents;
    const timestampElement = document.createElement('span');
    timestampElement.textContent = timestamp.slice(0, 10)
    timestampElement.setAttribute('class', 'post-date')

    box.append(commentContent, timestampElement);
    const outerWrapper = document.createElement('div');
    outerWrapper.appendChild(box);
    return outerWrapper;
}

await getPost(params.id).then( (postData) => {
    if (postData === undefined) {
        //TODO: make a better error message
        body.innerHTML = 'Could not find post.'
        return;
    }
    const post = createPostElement(postData.post_id, postData.contents, postData.date_created);

    body.appendChild(post);
});

const upperReplyBox = createReplyBox(body, (box, input, button) => {
    button.addEventListener('click', async () => {
        if (input.textContent === '') {
            return;
        }
        const userInput = input.textContent;
        const response = await fetch(`/api/posts/${params.id}/comments`, {
            method: 'post',
            body: JSON.stringify({
                contents: userInput
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        });
        if (response.ok) {
            input.textContent = '';
            let json = await response.json();
            const newComment = createReplyElement(json.post_id, json.contents, json.date_created);
            if (json.parent_comment === null) {
                body.insertBefore(newComment, upperReplyBox.nextSibling);
            } else {
                const parent = document.querySelector(`#comment-${parent.parent_comment}`).parentNode;
                parent.appendChild(newComment);
            }
        }
    })
});
body.appendChild(upperReplyBox);

await getComments(params.id).then((comments) => {
    if (comments === undefined) {return;}
    for (let comment of comments) {
        const reply = createReplyElement(comment.comment_id, comment.contents, comment.date_created);

        if (comment.parent_comment === null) {
            body.insertBefore(reply, upperReplyBox.nextSibling);
        } else {
            const parent = document.querySelector(`#comment-${comment.parent_comment}`).parentNode;
            parent.appendChild(reply);
        }
    }
})