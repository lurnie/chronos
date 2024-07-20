import 'dotenv/config';
import express from 'express';

import bcrypt from 'bcrypt';
import crypto from 'crypto';

import cookieParser from 'cookie-parser';

import {readFile} from 'fs';
import {rateLimit} from 'express-rate-limit';

const app = express();
const port = process.env.PORT;

const path = '../frontend/';

import { getAllPosts, getPost, createPost, getComment, getCommentsFromParentComment, getCommentsFromPost, createComment,
    createUser, getUserById, getUserByUsername, getSession, setSession, deleteSession, deletePost, deleteComment, safeGetUserById, safeGetUserByUsername,
    getPostsByUsername
 } from './database.js';


 // rate limits
 app.use('/api', rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many API requests'
}));
app.use('/api/join', rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'You can only create 5 accounts in one hour'
}));
app.post('/api/posts', rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    limit: 8,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'You are posting too much'
}));
app.post('/api/posts/:id/comments', rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 15,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'You are posting too many comments'
}));


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
        <link rel='stylesheet' href='/styles/main.css'>
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
    // the current userId and username is always included in the parameters to send to the frontend
    parameters.userId = req.userId;
    parameters.username = req.username;
    parameters.admin = req.admin;
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
    req.admin = false;
    if (req.cookies.session) {
        let session = await getSession(req.cookies.session);
        if (session) {
            req.userId = session.user_id;
            const user = await getUserById(req.userId);
            req.username = user.username;

            if (user.admin_privileges === 1) {
                req.admin = true;
            }
        }
    }
    next();
}
app.use(getCurrentUser);

function requireUserAuth(req, res, next) {
    if (req.userId) {
        next();
    } else {
        res.status(401).send('Must be logged in.');
    }
}
function requireLoggedOut(req, res, next) {
    if (!req.userId) {next();} else {res.status(401).send('Must be logged out.')}
}
function redirectIfLoggedIn(req, res, next) {
    if (!req.userId) {next();} else {res.redirect('/');}
}

function isAlphamumeric(string) {
    for (let i = 0; i < string.length; i++) {
        let code = string.charCodeAt(i);
        if (!(
            (code > 47 && code < 58) || // 0-9
            (code > 64 && code < 91) || // A-Z
            (code > 96 && code < 123) // a-z
        )) {return false;}
    }
    return true;
}

app.get('/', async (req, res) => {
    res.redirect('/posts');
})


app.get('/join', redirectIfLoggedIn, async (req, res) => {
    returnPage(req, res, 'join.html', 'Join');
});
app.post('/api/join', requireLoggedOut, async (req, res) => {
    try {
        const {username, password} = req.body;
        if (!username) {res.status(400).send('Missing username'); return;}
        if (!password) {res.status(400).send('Missing password'); return;}
        if (!isAlphamumeric(username)) {res.status(400).send('Username can only be made up of numbers 0-9 or letters A-Z'); return;}
        if (username.length > 20) {res.status(400).send('Username cannot be longer than 20 characters.'); return;}
        if (password.length > 40) {res.status(400).send('Password cannot be longer than 40 characters.'); return;}
        if (password.length < 3) {res.status(400).send('Password must be at least 3 chars'); return;}
        const hash = await bcrypt.hash(password, 13);
        const result = await createUser(username, hash);
        if (typeof(result) === 'object') {
            // there was an error
            res.status(400).send(result.code);
        } else {
            res.send('Account created.');
        }

    } catch (err) {
        console.log(err);
        res.status(400).send('Unable to create account.');
    }
})

app.get('/login', redirectIfLoggedIn, async (req, res) => {
    returnPage(req, res, 'login.html', 'Login');
});
app.post('/api/login', requireLoggedOut, async (req, res) => {
    try {
        const {username, password} = req.body;
        if (!username) {res.status(400).send('Missing username'); return;}
        if (!password) {res.status(400).send('Missing password'); return;}

        let user = await getUserByUsername(username);
        if (user === undefined) {
            res.status(401).send('User not found');
        } else {
            const isMatch = await bcrypt.compare(password, user.hash.toString());
            if (isMatch) {
                let sessionId = crypto.randomBytes(16).toString('hex');

                res.cookie('session', sessionId, {
                    httpOnly: true,
                    sameSite: 'strict'
                });
                let sessionResult = await setSession(user.user_id, sessionId);
                if (sessionResult === 400) {
                    res.status(400).send('Error logging in');
                } else {
                    res.send('Logged in');
                }
            } else {
                res.status(401).send('Incorrect password')
            }
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
app.delete('/api/posts/:id', requireUserAuth, async (req, res) => {
    let post = await getPost(req.params.id);
    if (post === 400 || !post) {
        res.status(400).send('Error getting post');
        return;
    }
    if (req.userId !== post.user_id && !req.admin) {res.status(401).send('You can only delete posts that you made'); return;}
    let result = await deletePost(req.params.id);
    if (result === 400) {
        res.status(400).send('Unable to delete post')
    } else {
        res.send('Post deleted')
    }
})
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

app.get('/api/comments/:id', async (req, res) => {
    res.send(await getComment(req.params.id));
});
app.delete('/api/comments/:id', requireUserAuth, async (req, res) => {
    const comment = await getComment(req.params.id);
    if (comment === 400 || !comment) {res.status(400).send('Error getting comment'); return;}
    if (req.userId !== comment.user_id && !req.admin) {res.status(401).send('You can only delete comments that you made'); return;}
    const result = await deleteComment(req.params.id);
    if (result === 400) {
        res.status(400).send('Unable to delete comment');
    } else {
        res.status(200).send('Comment deleted');
    }
});


app.get('/users/:username', async (req, res, next) => {
    const response = await safeGetUserByUsername(req.params.username)
    if (response === 400 || !response) {next(); return;}
    returnPage(req, res, 'user.html', req.params.username, {user: response});
});
app.get('/api/users/:username', async (req, res) => {
    const response = await safeGetUserByUsername(req.params.username)
    if (response === 400) {res.status(400).send('Error getting user')}
    res.send(response);
});
app.get('/api/users/id/:id', async (req, res) => {
    const response = await safeGetUserById(req.params.id)
    if (response === 400) {res.status(400).send('Error getting user')}
    res.send(response);
});
app.get('/api/users/:username/posts', async (req, res) => {
    const response = await getPostsByUsername(req.params.username)
    if (response === 400) {res.status(400).send('Error getting user posts')}
    res.send(response);
});

app.get('*', (req, res) => {
    returnPage(req, res, '404.html', '404 Page Not Found', undefined, 404);
})

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`)
});
