import { createErrorElement } from "./error.js";

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