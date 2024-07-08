function createPostElement(contents, timestamp) {
    let div = document.createElement('div');
    div.setAttribute('class', 'post');
    let contentsElement = document.createElement('span');
    contentsElement.textContent = contents;
    contentsElement.setAttribute('class', 'post-content')
    let timestampElement = document.createElement('span');
    timestampElement.textContent = timestamp.slice(0, 10);
    timestampElement.setAttribute('class', 'post-date')
    div.appendChild(contentsElement);
    div.appendChild(timestampElement);
    return div;
}

export {createPostElement};