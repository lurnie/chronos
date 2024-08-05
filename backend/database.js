import mysql from 'mysql2';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}).promise();


// TODO: properly catch the errors and return something that identifies them, rather than just 400

async function getCommentsFromPost(id) {
    const [results] = await pool.query(`SELECT comment_id, contents, post_id, parent_comment, comment.date_created, comment.user_id, user.username FROM comment JOIN user ON comment.user_id = user.user_id WHERE post_id = ? ORDER BY date_created`, [id]);
    return results;
}
async function getCommentsFromParentComment(id) {
    const [results] = await pool.query(`SELECT comment_id, contents, post_id, parent_comment, comment.date_created, comment.user_id, user.username FROM comment JOIN user ON comment.user_id = user.user_id WHERE parent_comment = ? ORDER BY date_created`, [id]);
    return results[0];
}
async function getComment(id) {
    const [results] = await pool.query(`SELECT comment_id, contents, post_id, parent_comment, comment.date_created, comment.user_id, user.username FROM comment JOIN user ON comment.user_id = user.user_id WHERE comment_id = ?`, [id]);
    return results[0];
}
async function deleteComment(id) {
    if (id === undefined) {return 400;}
    try {
        await pool.query('DELETE FROM comment WHERE comment_id = ?', [id]);
        return 200;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

async function createComment(postId, content, userId, parentId=null) {
    if (content === undefined || userId === undefined) {
        return 400;
    }
    if (content === '') {
        return 400;
    }
    try {
        const result = await pool.query('INSERT INTO comment(post_id, contents, user_id, parent_comment) VALUES(?, ?, ?, ?)', [postId, content, userId, parentId]);
        const resultComment = await getComment(result[0].insertId);
        return resultComment;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

async function getTotalPostsNumber() {
    const [[{posts}]] = await pool.query('SELECT COUNT(*) AS posts FROM post');
    return posts;
}

// note: currently, loves are gotten by counting the number of entries in the love table, but this might be bad for performance
async function getAllPosts(limit=10, offset=0) {
    const [results] = await pool.query(`SELECT post.post_id, contents, post.date_created, post.user_id, user.username, (SELECT COUNT(*) FROM love WHERE post.post_id = love.post_id) AS loves, (SELECT COUNT(*) FROM comment WHERE post.post_id = comment.post_id) AS comments FROM post JOIN user ON post.user_id = user.user_id ORDER BY date_created DESC LIMIT ? OFFSET ?`, [limit, offset]);
    return results;
}
async function getPostsByUsername(username, limit=10, offset=0) {
    const [results] = await pool.query(`SELECT post.post_id, contents, post.date_created, post.user_id, user.username, (SELECT COUNT(*) FROM love WHERE post.post_id = love.post_id) AS loves, (SELECT COUNT(*) FROM comment WHERE post.post_id = comment.post_id) AS comments FROM post JOIN user ON post.user_id = user.user_id WHERE user.username = ? ORDER BY date_created DESC LIMIT ? OFFSET ?`, [username, limit, offset]);
    return results;
}
async function getPost(id) {
    const [results] = await pool.query(`SELECT post.post_id, post.contents, post.date_created, post.user_id, user.username, (SELECT COUNT(*) FROM love WHERE post.post_id = love.post_id) AS loves, (SELECT COUNT(*) FROM comment WHERE post.post_id = comment.post_id) AS comments FROM post JOIN user ON post.user_id = user.user_id WHERE post.post_id = ?`, [id]);
    return results[0];
}
async function createPost(content, userId) {
    if (content === undefined || userId === undefined) {
        return 400;
    }
    if (content === '') {
        return 400;
    }
    try {
        const result = await pool.query(`INSERT INTO post(contents, user_id) VALUES(?, ?)`, [content, userId]);
        const resultNote = await getPost(result[0].insertId);
        return resultNote;
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function deletePost(postId) {
    if (postId === undefined) {return 400;}
    try {
        await pool.query('DELETE FROM post WHERE post_id = ?', [postId]);
        return 200;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

async function createUser(username, hashedPassword) {
    if (username === undefined || hashedPassword === undefined) {return 400;}
    try {
        const result = await pool.query('INSERT INTO user(username, hash) VALUES(?, ?)', [username, hashedPassword]);
        const userId = result[0].insertId;
        return userId;
    } catch (err) {
        // since errors will be common and reported to the user, they won't be logged here
        return err;
    }
}
async function updateBio(username, newBio) {
    try {
        await pool.query('UPDATE user SET bio = ? WHERE username = ?', [newBio, username])
    } catch (err) {
        return err;
    }
}
// these are "unsafe" because all user data, including private information, will be returned
async function unsafeGetUserById(userId) {
    if (userId === undefined) {return 400;}
    try {
        const [result] = await pool.query('SELECT *, (SELECT COUNT(*) FROM post WHERE post.user_id = user.user_id) AS posts FROM user WHERE user_id = ?', [userId]);
        return result[0];
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function unsafeGetUserByUsername(username) {
    if (username === undefined) {return 400;}
    try {
        const [result] = await pool.query('SELECT *, (SELECT COUNT(*) FROM post WHERE post.user_id = user.user_id) AS posts FROM user WHERE username = ?', [username]);
        return result[0];
    } catch (err) {
        console.log(err);
        return 400;
    }
}

// gives back all the data except private information, like the password hash
async function safeGetUserById(userId) {
    if (userId === undefined) {return 400;}
    try {
        const [result] = await pool.query('SELECT user_id, username, admin_privileges, date_created, bio, (SELECT COUNT(*) FROM post WHERE post.user_id = user.user_id) AS posts FROM user WHERE user_id = ?', [userId]);
        return result[0];
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function safeGetUserByUsername(username) {
    if (username === undefined) {return 400;}
    try {
        const [result] = await pool.query('SELECT user_id, username, admin_privileges, date_created, bio, (SELECT COUNT(*) FROM post WHERE post.user_id = user.user_id) AS posts FROM user WHERE username = ?', [username]);
        return result[0];
    } catch (err) {
        console.log(err);
        return 400;
    }
}

async function getSession(sessionId) {
    if (sessionId === undefined) {return 400;}
    try {
        const [result] = await pool.query('SELECT * FROM session WHERE session_id = ?', [sessionId]);
        return result[0];
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function setSession(userId, sessionId) {
    if (userId === undefined || sessionId === undefined) {return 400;}
    try {
        // just in case the session did not get deleted and is still saved in the database
        const [[{does_exist}]] = await pool.query('SELECT EXISTS(SELECT * FROM session WHERE user_id = ?) AS does_exist', [userId]);
        if (does_exist) {
            // session still exists in the database
            await pool.query('UPDATE session SET session_id = ? WHERE user_id = ?', [sessionId, userId]);
            return 200;
        } else {
            // session does not exist yet
            await pool.query('INSERT INTO session(user_id, session_id) VALUES(?, ?)', [userId, sessionId]);
            return 200;
        }
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function deleteSession(userId) {
    if (userId === undefined) {return 400;}
    try {
        await pool.query('DELETE FROM session WHERE user_id = ?', [userId]);
        return 200;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

async function addLove(postId, userId) {
    if (postId === undefined || userId === undefined) {return 400;}
    try {
        await pool.query('INSERT INTO love VALUES(?, ?)', [postId, userId])
    } catch (err) {
        const code = err.code;
        if (!code === 'ER_DUP_ENTRY') {
            console.log(err);
        }
        return err;
    }
}
async function deleteLove(postId, userId) {
    if (postId === undefined || userId === undefined) {return 400;}
    try {
        await pool.query('DELETE FROM love WHERE post_id = ? AND user_id = ?', [postId, userId]);
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function loveExists(postId, userId) {
    const result = await pool.query('SELECT * FROM love WHERE post_id = ? AND user_id = ?', [postId, userId]);
    if (result[0].length > 0) {return true;} else {return false;}
}
async function getLovesByPost(postId) {
    const [results] = await pool.query('SELECT user_id FROM love WHERE post_id = ?', [postId]);
    return results;
}
async function getLovesByUserId(userId) {
    const [results] = await pool.query('SELECT post_id FROM love WHERE user_id = ?', [userId]);
    return results;
}
async function getLovesByUsername(username) {
    const [results] = await pool.query('SELECT post_id FROM love WHERE user_id IN (SELECT user_id FROM user WHERE username = ?)', [username]);
    return results;
}
export {getAllPosts, getPost, createPost, getComment, getCommentsFromParentComment, getCommentsFromPost, createComment, createUser,
    unsafeGetUserById, unsafeGetUserByUsername, getSession, setSession, deleteSession, deletePost, deleteComment, safeGetUserById, safeGetUserByUsername, getPostsByUsername, addLove,
    getLovesByPost, getLovesByUserId, getLovesByUsername, deleteLove, loveExists, getTotalPostsNumber, updateBio
};