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
