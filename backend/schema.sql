CREATE TABLE post (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    contents VARCHAR(140) NOT NULL,
    user_id INT NOT NULL,
    date_created DATETIME DEFAULT NOW(),
    FOREIGN KEY post(user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

CREATE TABLE comment (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    contents VARCHAR(140) NOT NULL,
    post_id INT,
    user_id INT NOT NULL,
    parent_comment INT DEFAULT NULL,
    date_created DATETIME DEFAULT NOW(),
    FOREIGN KEY comment(post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment) REFERENCES comment(comment_id) ON DELETE CASCADE,
    FOREIGN KEY comment(user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

CREATE TABLE user (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(20) UNIQUE NOT NULL,
    hash VARCHAR(20),
    admin_privileges tinyint(1) DEFAULT(0),
    date_created DATETIME DEFAULT NOW()
);

CREATE TABLE session (
    user_id INT PRIMARY KEY,
    session_id CHAR(32) UNIQUE,
    FOREIGN KEY session(user_id) REFERENCES user(user_id) ON DELETE CASCADE
);