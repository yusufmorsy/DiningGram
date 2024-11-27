-- 1. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100), -- Optional: First and last name
    email_address VARCHAR(50), -- Optional
    hashed_password CHAR(60) NOT NULL, -- Hashed password
    profile_biography TEXT, -- Optional user biography
    profile_pic_url TEXT DEFAULT 'https://example.com/default-profile-pic.jpg', -- Default profile picture
    location VARCHAR(100) DEFAULT 'Unknown' -- Default location
);

-- 2. Dining Halls Table
CREATE TABLE dining_halls (
    hall_id SERIAL PRIMARY KEY,
    hall_name VARCHAR(50) NOT NULL,
    avg_rating DECIMAL(2,1) DEFAULT 0, -- Example: 4.9
    image_url TEXT NOT NULL, -- Image URL of the dining hall
    hall_description TEXT NOT NULL, -- Description of the dining hall
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of creation
);

-- 3. Posts Table
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    poster_id INT NOT NULL,
    reviewed_hall_id INT NOT NULL,
    hall_rating INT CHECK (hall_rating >= 0), -- Rating out of 5
    likes INT DEFAULT 0, -- Number of likes
    image_url TEXT, -- Image associated with the post
    post_content TEXT NOT NULL, -- Content of the post
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of post creation
    FOREIGN KEY (poster_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_hall_id) REFERENCES dining_halls(hall_id) ON DELETE CASCADE
);

-- 4. Comments Table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    commenter_id INT NOT NULL,
    likes INT DEFAULT 0, -- Number of likes on the comment
    comment_content TEXT NOT NULL, -- Content of the comment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of comment creation
    FOREIGN KEY (commenter_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Post to Comment Table
CREATE TABLE post_to_comment (
    post_id INT NOT NULL,
    comment_id INT NOT NULL,
    PRIMARY KEY (post_id, comment_id), -- Ensures unique post-comment relationships
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE
);

-- 6. Tagged Posts Table
CREATE TABLE tagged_posts (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    PRIMARY KEY (user_id, post_id), -- Ensures unique user-post tagging
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

-- 7. Liked Posts Table
CREATE TABLE liked_posts (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    PRIMARY KEY (user_id, post_id), -- Ensures unique user-post likes
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);
