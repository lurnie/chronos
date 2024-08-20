async function createErrorElement(response) {
    let errorText = await response.text();
    const error = await createMessageElement(`Error: ${errorText}`);
    error.setAttribute('class', 'error-box message');
    document.body.append(error);
}

async function createConfirmationElement(text) {
    const message = await createMessageElement(text);
    message.setAttribute('class', 'confirmation-box message');
    document.body.append(message);
}

async function createMessageElement(text) {
    const message = document.createElement('div');
    const span = document.createElement('span');
    span.textContent = text;
    const x = document.createElement('button');
    x.textContent = 'X';
    x.setAttribute('class', 'x-button')
    x.addEventListener('click', () => {
        message.remove();
    })
    message.append(span, x);
    return message;
}

export {createErrorElement, createConfirmationElement};