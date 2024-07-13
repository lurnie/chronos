CREATE TABLE post (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    contents VARCHAR(140) NOT NULL,
    date_created DATETIME DEFAULT(NOW())
);

CREATE TABLE comment (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    contents VARCHAR(140) NOT NULL,
    post_id INT,
    parent_comment INT DEFAULT(NULL),
    date_created DATETIME DEFAULT(NOW()),
    FOREIGN KEY comment(post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment) REFERENCES comment(comment_id) ON DELETE CASCADE
);