import mysql from 'mysql2';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}).promise();

async function getAllPosts() {
    const [results] = await pool.query(`SELECT * FROM post`);
    return results;
}
async function getPost(id) {
    const [results] = await pool.query(`SELECT * FROM post WHERE post_id = ?`, [id]);
    return results[0];
}
async function createPost(content) {
    await pool.query(`INSERT INTO post(contents) VALUES(?)`, [content]);
}

export {getAllPosts, getPost, createPost};