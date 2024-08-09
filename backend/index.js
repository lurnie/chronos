
import 'dotenv/config';
import express from 'express';

import bcrypt from 'bcrypt';
import crypto from 'crypto';

import cookieParser from 'cookie-parser';

import {rateLimit} from 'express-rate-limit';

import { getAllPosts, getPost, createPost, getComment, getCommentsFromParentComment, getCommentsFromPost, createComment,
    createUser, unsafeGetUserById, unsafeGetUserByUsername, getSession, setSession, deleteSession, deletePost, deleteComment, safeGetUserById, safeGetUserByUsername,
    getPostsByUsername, addLove, getLovesByPost, getLovesByUserId, getLovesByUsername, deleteLove, loveExists, getTotalPostsNumber, updateBio,
    addFollower, removeFollower, getFollowers, getFollowings, getFollowerFeed, followExists, getFeedSize
} from './database.js';

// create app
const app = express();
const port = process.env.PORT;

const path = '../frontend/';

app.set('view engine', 'ejs')
app.set('views', path + 'views');

function createRateLimit(ms, limit, message) {
    return rateLimit({
        windowMs: ms,
        limit: limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: message
    });
}

 // rate limits
 app.use('/api', createRateLimit(0.25*60*1000, 200, 'Too many API requests'));
app.use('/api/join', createRateLimit(60*60*1000, 10, 'You can only create 5 accounts in one hour'));
app.post('/api/posts', createRateLimit(3*60*1000, 8, 'You are posting too much'));
app.post('/api/posts/:id/comments', createRateLimit(5*60*1000, 15, 'You are posting too many comments'));



app.use(express.static(path + 'public'));
app.use('/uploads', express.static('uploads'));

app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({extended: false}));

async function getCurrentUser(req, res, next) {
    req.admin = false;
    if (req.cookies.session) {
        let session = await getSession(req.cookies.session);
        if (session) {
            req.userId = session.user_id;
            const user = await safeGetUserById(req.userId);
            req.username = user.username;

            if (user.admin_privileges === 1) {
                req.admin = true;
            }
        }
    }
    req.user = {userId: req.userId, username: req.username, admin: req.admin};
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
    res.render('join', {title: 'Join', user: req.user});
});

function hasWhiteSpace(str) {
    return (/\s/).test(str);
}

app.post('/api/join', requireLoggedOut, async (req, res) => {
    try {
        const {username, password} = req.body;
        if (!username) {res.status(400).send('Missing username'); return;}
        if (!password) {res.status(400).send('Missing password'); return;}
        if (!isAlphamumeric(username)) {res.status(400).send('Username can only be made up of numbers 0-9 or letters A-Z'); return;}
        if (hasWhiteSpace(password)) {res.status(400).send('Password cannot have spaces'); return;}
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
    res.render('login', {title: 'Login', user: req.user});
});
app.post('/api/login', requireLoggedOut, async (req, res) => {
    try {
        const {username, password} = req.body;
        if (!username) {res.status(400).send('Missing username'); return;}
        if (!password) {res.status(400).send('Missing password'); return;}

        let user = await unsafeGetUserByUsername(username);
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
                res.status(401).send('Incorrect password');
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

const maxPostsPerFeed = 20;
const maxPostsPerUserPage = 20;

app.get('/posts', async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}

    const posts = await getAllPosts(maxPostsPerFeed, (page-1)*maxPostsPerFeed);
    const postsNumber = await getTotalPostsNumber();
    res.render('posts', {title: 'Posts', posts: posts, maxPages: Math.ceil(postsNumber/maxPostsPerFeed), page: page, user: req.user, postLink: true});
});
app.get('/feed', requireUserAuth, async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}
    const posts = await getFollowerFeed(req.userId, maxPostsPerFeed, (page-1)*maxPostsPerFeed);
    const postsNumber = await getFeedSize(req.userId);
    res.render('feed', {title: 'Feed', posts: posts, maxPages: Math.ceil(postsNumber/maxPostsPerFeed), page: page, user: req.user, postLink: true});
});
app.get('/posts/:id', async (req, res, next) => {
    const post = await getPost(req.params.id);
    if (post === undefined) {next(); return;}

    res.render('single-post', {title: 'Post', post: post, user: req.user, postLink: false});
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
app.get('/api/feed', requireUserAuth, async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}

    res.json(await getFollowerFeed(req.userId, maxPostsPerFeed, (page-1)*maxPostsPerFeed));
});
app.get('/api/posts', async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}

    res.json(await getAllPosts(maxPostsPerFeed, (page-1)*maxPostsPerFeed));
});
app.get('/api/posts/:id', async (req, res) => {
    res.json(await getPost(req.params.id));
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
        res.status(400).send('Unable to delete post');
    } else {
        res.send('Post deleted');
    }
});

app.get('/api/posts/:id/loves', async (req, res) => {
    res.json(await getLovesByPost(req.params.id));
});
app.get('/api/posts/:postId/loves/:userId', async (req, res) => {
    const exists = await loveExists(req.params.postId, req.params.userId);
    res.json({"loveExists": exists});
});
app.get('/api/users/:username/loves', async (req, res) => {
    res.send(await getLovesByUsername(req.params.username));
});
app.get('/api/users/id/:id/loves', async (req, res) => {
    res.send(await getLovesByUserId(req.params.id));
});
app.post('/api/users/:username/bio', async (req, res) => {
    if (req.username !== req.params.username) {
        res.status(400).send(`You do not have permission to change this user's bio`);
        return;
    }
    const {bio} = req.body;
    const result = await updateBio(req.username, bio);
    if (typeof(result) === 'object') {
        let code = result.code;
        if (code === 'ER_DATA_TOO_LONG') {
            res.status(400).send('Bio cannot be longer than 100 characters');
        } else {
            res.status(400).send('Unable to update bio');
        }
    } else {
        res.send('Updated bio');
    }
});

app.post('/users/:username/avatar', requireUserAuth, async (req, res) => {
    if (req.username !== req.params.username) {res.status(401).send('You must be logged in as the right user.'); return;}
    res.send('Updated avatar');
})

const maxUsersPerPage = 21;

app.get('/users/:username/followers', async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}

    const followers = await getFollowers(req.params.username, maxUsersPerPage, (page-1)*maxUsersPerPage);

    const viewingUser = await safeGetUserByUsername(req.params.username);

    res.render('followers', {title: `${req.params.username}'s followers`, maxPages: Math.ceil(viewingUser.followers/maxUsersPerPage), followers: followers, viewingUser: viewingUser, user: req.user, page: page});
});
app.get('/users/:username/following', async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}

    const following = await getFollowings(req.params.username, maxUsersPerPage, (page-1)*maxUsersPerPage);

    const viewingUser = await safeGetUserByUsername(req.params.username);

    res.render('following', {title: `${req.params.username} | following`, maxPages: Math.ceil(viewingUser.following/maxUsersPerPage), following: following, viewingUser: viewingUser, user: req.user, page: page});
});

app.get('/api/users/:username/followers', async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}

    const result = await getFollowers(req.params.username, maxUsersPerPage, (page-1)*maxUsersPerPage);
    res.json(result);
});
app.get('/api/users/:username/following', async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}

    const result = await getFollowings(req.params.username, maxUsersPerPage, (page-1)*maxUsersPerPage);
    res.json(result);
});
app.post('/api/users/id/:id/follows', requireUserAuth, async (req, res) => {
    req.params.id = Number(req.params.id);
    if (req.userId === req.params.id) {res.status(400).send('Cannot follow yourself'); return;}
    const result = await addFollower(req.userId, req.params.id);
    if (result === 200) {
        res.send('Followed user');
    } else {
        let code = result.code;
        if (code === 'ER_DUP_ENTRY') {
            res.send('User is already followed');
        } else {
            console.log(err);
            res.status(400).send('Error following user');
        }
    }
});
app.delete('/api/users/id/:id/follows', requireUserAuth, async (req, res) => {
    const result = await removeFollower(req.userId, req.params.id);
    if (result) {
        res.send('Unfollowed user');
    } else {
        res.status(400).send('Could not unfollow user');
    }
});
app.get('/api/users/id/:followed/follows/:follower', async (req, res) => {
    const result = await followExists(req.params.followed, req.params.follower);
    res.json({following: result});
})
app.post('/api/posts/:id/loves', requireUserAuth, async (req, res) => {
    const result = await addLove(req.params.id, req.userId);
    if (typeof(result) === 'object') {
        const code = result.code;
        if (code === 'ER_DUP_ENTRY') {
            res.send('Post is already loved');
        } else {
            res.status(400).send('Could not love post');
        }
    } else {
        res.send('Loved post');
    }
});
app.delete('/api/posts/:id/loves', requireUserAuth, async (req, res) => {
    const result = await deleteLove(req.params.id, req.userId);
    if (result === 400) {
        res.status(400).send('Could not unlove post');
    } else {
        res.send('Unloved post');
    }
})

app.get('/api/posts/:id/comments', async (req, res) => {
    res.json(await getCommentsFromPost(req.params.id));
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
    res.json(await getComment(req.params.id));
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
    const response = await safeGetUserByUsername(req.params.username);
    if (response === 400 || !response) {next(); return;}

    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}
    const posts = await getPostsByUsername(req.params.username, maxPostsPerUserPage, (page-1)*maxPostsPerUserPage);

    res.render('user', {viewingUser: response, title: `@${response.username}`, posts: posts, maxPages: Math.ceil(response.posts/maxPostsPerUserPage), page: page, postLink: true, user: req.user});
});
app.get('/api/users/:username', async (req, res) => {
    const response = await safeGetUserByUsername(req.params.username);
    if (response === 400) {res.status(400).send('Error getting user');}
    res.json(response);
});
app.get('/api/users/id/:id', async (req, res) => {
    const response = await safeGetUserById(req.params.id);
    if (response === 400) {res.status(400).send('Error getting user');}
    res.json(response);
});
app.get('/api/users/:username/posts', async (req, res) => {
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {page = 1;}
    const response = await getPostsByUsername(req.params.username, maxPostsPerUserPage, (page-1)*maxPostsPerUserPage);
    if (response === 400) {res.status(400).send('Error getting user posts');}
    res.json(response);
});

app.get('*', (req, res) => {
    res.render('404', {title: '404 Page Not Found', user: req.user});
})

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('500 Internal Server Error - failed to retrieve page');
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
