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
})