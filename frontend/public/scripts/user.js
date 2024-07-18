import { getDateString } from "./getDateString.js";

const username = document.querySelector('.user-username');
username.textContent = `@${params.user.username}`;
const userJoined = document.querySelector('.user-joined');
userJoined.textContent = `Joined ${getDateString(params.user.date_created)}`;