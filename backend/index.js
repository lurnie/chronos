import 'dotenv/config';
import express from 'express';

import bcrypt from 'bcrypt';
import crypto from 'crypto';

import cookieParser from 'cookie-parser';

import {readFile} from 'fs';

const app = express();
const port = 3000;

const path = '../frontend/';

import { getAllPosts, getPost, createPost, getComment, getCommentsFromParentComment, getCommentsFromPost, createComment,
    createUser, getUserById, getUserByUsername, getSession, setSession, deleteSession
 } from './database.js';


app.use(express.static(path + 'public'));

app.use(express.json());
app.use(cookieParser());

function addHTMLBoilerplate(html, title, parameters) {
    // TODO: do this in a better way or replace this completely?

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <script>let params = ${JSON.stringify(parameters)};</script>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <link rel='stylesheet' href='../styles/main.css'>
    </head>
    <body>
        ${parameters.userId ? navbarUser : navbarGuest}
        ${html}
    </body>
    </html>
    `
}

const defaultTitle = 'LurnSite';

async function returnPage(req, res, src, title=defaultTitle, parameters=new Object(), status=200) {
    parameters.userId = req.userId; // the current userId is always included in the parameters to send to the frontend
    readFile(path + 'public/pages/' + src, 'utf-8', (err, content) => {
        if (err) {
            console.log(`500 Internal Server Error - failed to retrieve ${path+'public/pages/'+src}`);
            res.status(500).send('500 Internal Server Error - page could not be retrieved');
        } else {
            let html = addHTMLBoilerplate(content, title, parameters);
            res.status(status).send(html);
        }
    })
}

let navbarUser;
readFile(path + 'public/pages/navbarUser.html', 'utf-8', (err, content) => {
    if (err) {
        navbarUser = '';
    } else {
        navbarUser = content;
    }
});
let navbarGuest;
readFile(path + 'public/pages/navbarGuest.html', 'utf-8', (err, content) => {
    if (err) {
        navbarGuest = '';
    } else {
        navbarGuest = content;
    }
});

app.use(express.urlencoded({extended: false}));

async function getCurrentUser(req, res, next) {
    if (req.cookies.session) {
        let session = await getSession(req.cookies.session);
        if (!session) {req.userId = undefined;}
        else {req.userId = session.user_id;}
    } else {
        req.userId = undefined;
    }
    next();
}
app.use(getCurrentUser);

async function requireUserAuth(req, res, next) {
    if (req.userId) {
        next();
    } else {
        res.status(401).send('Must be logged in.');
    }
}
async function requireLoggedOut(req, res, next) {
    if (!req.userId) {next();} else {res.status(401).send('Must be logged out.')}
}
async function redirectIfLoggedIn(req, res, next) {
    if (!req.userId) {next();} else {res.redirect('/');}
}

app.get('/', async (req, res) => {
    res.redirect('/posts');
})

app.get('/login', redirectIfLoggedIn, async (req, res) => {
    returnPage(req, res, 'login.html', 'Login');
});
app.post('/api/login', requireLoggedOut, async (req, res) => {
    try {
        const {username, password} = req.body;
        if (!username || !password) {res.status(400).send('Missing password or username.'); return;}
        let user = await getUserByUsername(username);
        if (user === undefined) {
            res.status(401).send('User not found.')
        } else if (password === user.hash) {
            let sessionId = crypto.randomBytes(16).toString('hex');

            res.cookie('session', sessionId, {
                httpOnly: true,
                sameSite: 'strict'
            });
            let sessionResult = await setSession(user.user_id, sessionId);
            if (sessionResult === 400) {
                res.status(400).send('Error logging in.');
            } else {
                res.send('Logged in.');
            }
        } else {
            res.status(401).send('Incorrect password.')
        }
    } catch (err) {
        console.log(err);
        res.status(400).send('Unable to login.');
    }
});
app.post('/api/logout', requireUserAuth, async (req, res) => {
    let {user_id} = await getSession(req.cookies.session);
    await deleteSession(user_id);
    res.clearCookie('session');
    res.send('Logged out.');

});

app.get('/posts', async (req, res) => {
    returnPage(req, res, 'posts.html', 'Posts');
});
app.get('/posts/:id', async (req, res) => {
    returnPage(req, res, 'single-post.html', 'Post', {id: req.params.id});
});
app.post('/api/posts', requireUserAuth, async (req, res) => {
    const {contents} = req.body;
    let result = await createPost(contents, req.userId);
    if (result === 400) {
        res.status(400).send('Unable to create post.');
    } else {
        res.send(result);
    }
})

app.get('/api/posts', async (req, res) => {
    res.send(await getAllPosts());
});
app.get('/api/posts/:id', async (req, res) => {
    res.send(await getPost(req.params.id));
});
app.get('/api/posts/:id/comments', async (req, res) => {
    res.send(await getCommentsFromPost(req.params.id));
});
app.post('/api/posts/:id/comments', requireUserAuth, async (req, res) => {
    const {contents, parentId} = req.body;
    let result = await createComment(req.params.id, contents, req.userId, parentId);
    if (result === 400) {
        res.status(400).send('Unable to create comment.');
    } else {
        res.send(result);
    }
});

app.get('*', (req, res) => {
    returnPage(req, res, '404.html', '404 Page Not Found', undefined, 404);
})

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`)
});
