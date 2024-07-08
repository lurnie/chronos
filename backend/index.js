import 'dotenv/config';
import express from 'express';

import {readFile} from 'fs';

const app = express();
const port = 3000;

const path = '../frontend/';

import { getAllPosts, getPost, createPost } from './database.js';


app.use(express.static(path + 'public'));

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
        ${navbar}
        ${html}
    </body>
    </html>
    `
}

const defaultTitle = 'LurnSite';

async function returnPage(req, res, src, title=defaultTitle, parameters) {
    readFile(path + 'public/pages/' + src, 'utf-8', (err, content) => {
        if (err) {
            console.log(`500 Internal Server Error - failed to retrieve ${path+'public/pages/'+src}`);
            res.status(500).send('500 Internal Server Error - page could not be retrieved');
        } else {
            let html = addHTMLBoilerplate(content, title, parameters);
            res.send(html);
        }
    })
}

let navbar;
readFile(path + 'public/pages/navbar.html', 'utf-8', (err, content) => {
    if (err) {
        navbar = '';
    } else {
        navbar = content;
    }
});

app.get('/posts', async (req, res) => {
    returnPage(req, res, 'posts.html', 'Posts');
});
app.get('/posts/:id', async (req, res) => {
    returnPage(req, res, 'single-post.html', 'Post', {id: req.params.id});
});
app.get('/api/posts', async (req, res) => {
    res.send(await getAllPosts());
});
app.get('/api/posts/:id', async (req, res) => {
    res.send(await getPost(req.params.id));
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`)
});
