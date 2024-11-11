CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100), -- NOT NULL, --First and last name
    email_address VARCHAR(50), --NOT NULL,
    hashed_password CHAR(60) NOT NULL, --Remember to hash password before inserting
    profile_biography TEXT -- Optional for user
);

CREATE TABLE dining_halls (
    hall_id SERIAL PRIMARY KEY,
    hall_name VARCHAR(50) NOT NULL,
    avg_rating DECIMAL(2,1) DEFAULT 0, -- How it should work/look: <Digit>.<Digit>; Ex: 4.9
    image_url TEXT NOT NULL, -- Subject to change, if we want to do 'upload file' instead
    hall_description TEXT NOT NULL -- Fails the point of a media platform if desc is empty
);

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    poster_id INT NOT NULL,
    reviewed_hall_id INT NOT NULL,
    hall_rating INT CHECK (hall_rating >= 0),
    likes INT DEFAULT 0,
    image_url TEXT, -- Subject to change, if we want to do 'upload file' instead
    post_content TEXT NOT NULL, -- Users can spam empty posts, so empty text is not optional
    FOREIGN KEY (poster_id) REFERENCES users(user_id),
    FOREIGN KEY (reviewed_hall_id) REFERENCES dining_halls(hall_id)
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    commenter_id INT NOT NULL,
    likes INT DEFAULT 0,
    comment_content TEXT NOT NULL, -- Users can spam empty comments, so empty text is not optional
    FOREIGN KEY (commenter_id) REFERENCES users(user_id)
);

--Allows us to determine which comments are for which post
CREATE TABLE post_to_comment (
    post_id INT NOT NULL,
    comment_id INT NOT NULL,
    PRIMARY KEY (post_id, comment_id), -- Ensures no duplicates are added here
    FOREIGN KEY (post_id) REFERENCES posts(post_id),
    FOREIGN KEY (comment_id) REFERENCES comments(comment_id)
);

--May be removed
CREATE TABLE tagged_posts (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

--From clicking the like button; useful in ensuring no users likes a post more than once
CREATE TABLE liked_posts (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
);