import { createErrorElement } from "./error.js";

function isInView(element) {
    let rect = element.getBoundingClientRect();
    let top = rect.top;
    let bottom = rect.bottom;

    let inView = top < window.innerHeight && bottom >= 0
    return inView;
}

const body = document.querySelector('body');

document.querySelectorAll('.post').forEach((post) => {
    const dropdown = post.querySelector('.dropdown');
    if (!dropdown) {return;} // this is the input field because it has no dropdown

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

    const id = dropdown.getAttribute('id').slice(9) // removes the 'dropdown-' from the id and only gets the id

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


    const loveButton = post.querySelector('.heart');

    let done = false;

    const setLoveStatus = () => {
        // if the post is in view, it checks whether the post was loved or not
        // if it's already checked before, then it immediately returns
        if (done) {return;}
        if (isInView(post)) {
            done = true;
            fetch(`/api/posts/${id}/loves/${user.userId}`).then(async (result) => {
                let json = await result.json();
                if (json.loveExists) {
                    loveButton.setAttribute('class', 'heart loved');
                } else {
                    loveButton.setAttribute('class', 'heart');
                }
            });
        }
    };

    window.addEventListener('scroll', setLoveStatus);
    setLoveStatus(); // runs once on page load so that you don't have to scroll in order for the currently visible posts to check if they're loved or not

    const stats = loveButton.nextElementSibling;
    loveButton.addEventListener('click', async () => {
        const loved = (loveButton.getAttribute('class') === 'heart loved');
        let method;
        if (loved) {
            method = 'DELETE';
            loveButton.setAttribute('class', 'heart');
        } else {
            method = 'POST';
            loveButton.setAttribute('class', 'heart loved');

        }
        const response = await fetch(`/api/posts/${id}/loves`, {
            method: method,
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        });
        if (response.ok) {
            if (method === 'POST') {stats.textContent++;} else {stats.textContent--;} // automatically updates the like counter
        } else {
            createErrorElement(response);
        }
    });
});