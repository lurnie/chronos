async function createErrorElement(response) {
    const error = document.createElement('div');
    error.setAttribute('class', 'error-header');
    const span = document.createElement('span');
    let errorText = await response.text();
    span.textContent = `Error: ${errorText}`;
    const x = document.createElement('button');
    x.textContent = 'X';
    x.setAttribute('class', 'error-x-button')
    x.addEventListener('click', () => {
        error.remove();
    })
    error.append(span, x);
    document.body.append(error);
}

export {createErrorElement};