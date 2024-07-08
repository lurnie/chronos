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

getPost(params.id).then( (postData) => {
    if (postData === undefined) {
        //TODO: make a better error message
        body.innerHTML = 'Could not find post.'
        return;
    }
    const post = createPostElement(postData.contents, postData.date_created);

    body.appendChild(post);
}
)