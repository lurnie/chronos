const logout = document.querySelector('#logout');

logout.addEventListener('click', async () => {
    const response = await fetch('/api/logout', {
        method: 'post',
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    });
    if (response.ok) {
        window.location.href = '/';
    }
});