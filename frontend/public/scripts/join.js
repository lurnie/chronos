const form = document.querySelector('form');

const usernameError = document.querySelector('#username-error');
const passwordError = document.querySelector('#password-error');

form.addEventListener('submit', async (event) => {
    usernameError.textContent = '';
    passwordError.textContent = '';

    event.preventDefault();
    let formData = new FormData(form);
    let values = Object.fromEntries(formData);

    // create account
    const response = await fetch('/api/join', {
        method: 'post',
        body: JSON.stringify(values),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    });
    if (response.ok) {
        // login with that account
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
            window.location.href = '/login';
        }
    } else {
        let errorText = await response.text();
        if (errorText === 'Username cannot be longer than 20 characters.') {usernameError.textContent = errorText;}
        if (errorText === 'Password cannot be longer than 40 characters.') {passwordError.textContent = errorText;}
        if (errorText === 'ER_DUP_ENTRY') {usernameError.textContent = 'Username is already taken.';}
        if (errorText === 'Missing username') {usernameError.textContent = 'Missing username.';}
        if (errorText === 'Missing password') {passwordError.textContent = 'Missing password.';}
        if (errorText === 'Password must be at least 3 chars') {passwordError.textContent = 'Password must be at least 3 characters.';}
        if (errorText === 'Username can only be made up of numbers 0-9 or letters A-Z') {usernameError.textContent = 'Username can only be made up of numbers 0-9 or letters A-Z.';}
        if (passwordError.textContent === '' && usernameError.textContent === '') {usernameError.textContent = 'Unknown error. Reload page or try again.';}
    }
});