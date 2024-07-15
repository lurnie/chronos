const form = document.querySelector('form');

form.addEventListener('submit', async (event) => {
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
    }
});