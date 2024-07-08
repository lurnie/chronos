CREATE TABLE post (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    contents VARCHAR(140) NOT NULL,
    date_created DATETIME DEFAULT(NOW())
);
