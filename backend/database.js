import mysql from 'mysql2';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}).promise();


// TODO: properly catch the errors and return something that identifies them, rather than just 400

async function getCommentsFromPost(id) {
    //TODO: maybe remove the IS NULL requirement?
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

async function getAllPosts() {
    const [results] = await pool.query(`SELECT post_id, contents, post.date_created, post.user_id, user.username FROM post JOIN user ON post.user_id = user.user_id ORDER BY date_created DESC`);
    return results;
}
async function getPost(id) {
    const [results] = await pool.query(`SELECT post_id, contents, post.date_created, post.user_id, user.username FROM post JOIN user ON post.user_id = user.user_id WHERE post_id = ?`, [id]);
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

async function createUser(username, hashedPassword) {
    if (username === undefined || hashedPassword === undefined) {return 400;}
    try {
        const result = await pool.query('INSERT INTO user(username, hash) VALUES(?, ?)', [username, hashedPassword]);
        const userId = result[0].insertId;
        return userId;
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function getUserById(userId) {
    if (userId === undefined) {return 400;}
    try {
        const [result] = await pool.query('SELECT * FROM user WHERE user_id = ?', [userId]);
        return result[0];
    } catch (err) {
        console.log(err);
        return 400;
    }
}
async function getUserByUsername(username) {
    if (username === undefined) {return 400;}
    try {
        const [result] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
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

export {getAllPosts, getPost, createPost, getComment, getCommentsFromParentComment, getCommentsFromPost, createComment, createUser,
    getUserById, getUserByUsername, getSession, setSession, deleteSession
};