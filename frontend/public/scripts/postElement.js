// this function gets reused by multiple files

function createPostElement(id, contents, username, timestamp, link=false) {
    const div = document.createElement('div');

    const usernameElement = document.createElement('div');

    usernameElement.setAttribute('class', 'post-username');
    usernameElement.textContent = username;

    const contentsElement = document.createElement('span');
    contentsElement.textContent = contents;
    contentsElement.setAttribute('class', 'post-content')
    const timestampElement = document.createElement('span');
    let date = new Date(timestamp);
    let month = date.toLocaleString('en-us', {month: 'short'});
    let minutes = date.getMinutes();
    if (minutes < 10) {minutes = `0${minutes}`;} // prevents something like 8:02 from displaying as 8:2
    let dateString = `${month} ${date.getDate()} ${date.getFullYear()}, ${date.getHours()}:${minutes}`
    timestampElement.textContent = dateString;
    timestampElement.setAttribute('class', 'post-date');

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

    div.append(usernameElement, contentsElement, timestampElement);

    const secondDiv = document.createElement('div');

    deleteButton.addEventListener('click', async () => {
        const response = await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            if (!link) {div.remove();}
            else {secondDiv.remove()}
        }
    });

    if (link) {
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', `/posts/${id}`);
        linkElement.setAttribute('class', 'post-link');

        // it creates a second div that the link and main content are wrapped in so that the link only extends to the content of the post
        secondDiv.setAttribute('class', 'post');

        linkElement.appendChild(div);
        secondDiv.append(linkElement, dropdown);

        return secondDiv;
    }
    div.append(dropdown);
    div.setAttribute('class', 'post');
    return div;
}

export {createPostElement};