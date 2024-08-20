import { createErrorElement, createConfirmationElement } from "./messages.js";

const bioInput = document.querySelector('input.user-bio');
if (bioInput) {
    bioInput.addEventListener('change', async () => {
        const response = await fetch(`/api/users/${viewingUser.username}/bio`, {
            method: 'POST',
            body: JSON.stringify({
                bio: bioInput.value
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        });

        if (response.ok) {
            createConfirmationElement('Bio updated');
        } else {
            createErrorElement(response);
        }
    });
}

const followButton = document.querySelector('.follow-button');
const followerStat = document.querySelector('.followers-stat');

if (followButton) {
    fetch(`/api/users/id/${user.userId}/follows/${viewingUser.user_id}`).then((result) => {
        result.json().then((json) => {
            if (json.following) {
                followButton.textContent = 'Following';
                followButton.setAttribute('class', 'follow-button followed');
            } else {
                followButton.textContent = 'Follow';
                followButton.setAttribute('class', 'follow-button');
            }
        })

    });


    followButton.addEventListener('click', async () => {
        let following = followButton.getAttribute('class') === 'follow-button followed'
        let method;
        if (following) {
            method = 'DELETE';
        } else {
            method = 'POST';
        }
        const response = await fetch(`/api/users/id/${viewingUser.user_id}/follows`, {
            method: method,
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        });

        if (response.ok) {
            if (following === false) {
                followButton.textContent = 'Following';
                followButton.setAttribute('class', 'follow-button followed');
                followerStat.textContent++;
            } else {
                followButton.textContent = 'Follow';
                followButton.setAttribute('class', 'follow-button');
                followerStat.textContent--;
            }
        } else {
            createErrorElement(response);
        }
    })
}

const avatarInput = document.querySelector('#avatar');
const avatarForm = document.querySelector('#avatar-form');
const avatarModal = document.querySelector('.avatar-modal');
const cancelButton = document.querySelector('#cancel');
const saveButton = document.querySelector('#save');
const avatarPreview = document.querySelector('.avatar-preview');


cancelButton.addEventListener('click', () => {
    avatarModal.close();
});

saveButton.addEventListener('click', async () => {
    const data = new FormData(avatarForm);
    const response = await fetch(`/api/users/${viewingUser.username}/avatar`, {
        method: 'POST',
        body: data
    });
    if (response.ok) {
        // TODO: find a way to just reload the image, rather than the whole page
        location.reload();
    } else {
        createErrorElement(response);
    }
    avatarModal.close();
})

if (avatarInput) {
    avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files[0];
        avatarPreview.src = URL.createObjectURL(file);

        avatarModal.showModal();
    });
}
