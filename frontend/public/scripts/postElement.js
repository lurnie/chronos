// this function gets reused by multiple files

function createPostElement(id, contents, userId, timestamp, link=false) {
    const div = document.createElement('div');

    const contentsElement = document.createElement('span');
    contentsElement.textContent = contents;
    contentsElement.setAttribute('class', 'post-content')
    const timestampElement = document.createElement('span');
    timestampElement.textContent = timestamp.slice(0, 10);
    timestampElement.setAttribute('class', 'post-date')

    div.appendChild(contentsElement);
    div.appendChild(timestampElement);

    if (link) {
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', `/posts/${id}`);
        linkElement.setAttribute('class', 'post-link');

        // it creates a second div that the link and main content are wrapped in so that the link only extends to the content of the post
        const secondDiv = document.createElement('div');
        secondDiv.setAttribute('class', 'post');

        linkElement.appendChild(div);
        secondDiv.appendChild(linkElement);

        return secondDiv;
    }
    div.setAttribute('class', 'post');
    return div;
}

export {createPostElement};