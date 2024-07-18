function getDateString(timestamp) {
    let date = new Date(timestamp);
    let month = date.toLocaleString('en-us', {month: 'short'});
    let minutes = date.getMinutes();
    if (minutes < 10) {minutes = `0${minutes}`;} // prevents something like 8:02 from displaying as 8:2
    let dateString = `${month} ${date.getDate()} ${date.getFullYear()}, ${date.getHours()}:${minutes}`
    return dateString;
}

export {getDateString};