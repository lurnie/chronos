const form = document.querySelector('form');

form.addEventListener('submit', async (event) => {
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
    console.log('hi')
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
    }
});