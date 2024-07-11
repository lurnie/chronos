import mysql from 'mysql2';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}).promise();

async function getAllPosts() {
    const [results] = await pool.query(`SELECT * FROM post ORDER BY date_created DESC`);
    return results;
}
async function getPost(id) {
    const [results] = await pool.query(`SELECT * FROM post WHERE post_id = ?`, [id]);
    return results[0];
}
async function createPost(content) {
    if (content===undefined) {
        return 400;
    }
    if (content==='') {
        return 400;
    }
    try {
        const result = await pool.query(`INSERT INTO post(contents) VALUES(?)`, [content]);
        const resultNote = await getPost(result[0].insertId);
        return resultNote;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

export {getAllPosts, getPost, createPost};