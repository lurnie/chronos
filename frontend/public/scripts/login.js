const form = document.querySelector('form');

const usernameError = document.querySelector('#username-error');
const passwordError = document.querySelector('#password-error');

form.addEventListener('submit', async (event) => {
    usernameError.textContent = '';
    passwordError.textContent = '';

    event.preventDefault();
    let formData = new FormData(form);
    let values = Object.fromEntries(formData);

    const response = await fetch('/api/login', {
        method: 'post',
        body: JSON.stringify(values),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    });
    if (response.ok) {
        window.location.href = '/';
    } else {
        let errorText = await response.text();
        if (errorText === 'Missing username') {usernameError.textContent = 'Missing username.';}
        if (errorText === 'Missing password') {passwordError.textContent = 'Missing password.';}
        if (errorText === 'User not found') {usernameError.textContent = 'User not found.';}
        if (errorText === 'Incorrect password') {passwordError.textContent = 'Incorrect password.';}

        if (passwordError.textContent === '' && usernameError.textContent === '') {usernameError.textContent = 'Unknown error. Reload page or try again.';}
    }
});