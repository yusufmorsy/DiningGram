--hall_id is automatically due to SERIAL constraint
--avg_rating is given default of 0
INSERT INTO dining_halls
  (hall_name, image_url, hall_description)
VALUES
  ('Center for Community', 'https://tse3.mm.bing.net/th?id=OIP.ugns5levBrjiVcXsTiBDaAHaEK&pid=Api&P=0&h=220', 'Add text here 1'),
  ('Sewall Dining Center','https://tse2.mm.bing.net/th?id=OIP.w6sKjjK0mW0CnG6WrqxJRwHaFW&pid=Api&P=0&h=220','Add text here 2'),
  ('Village Center Dining','https://tse3.mm.bing.net/th?id=OIP.ah_MDBRA66n2zG7zR4tm2wHaFS&pid=Api&P=0&h=220','Add text here 3');

--Test dummy user; delete upon production
INSERT INTO users
  (username, full_name, email_address, hashed_password, profile_biography)
VALUES
  ('Spider-Man', 'Peter Parker', 'example1@gmail.com','totally_hashed','Your Friendly Neighborhood Spider-Man');

INSERT INTO posts (poster_id, reviewed_hall_id, hall_rating, image_url, post_content)
VALUES
  (1, 1, 5, 'https://tse3.mm.bing.net/th?id=OIP.ugns5levBrjiVcXsTiBDaAHaEK&pid=Api&P=0&h=220', 'Absolutely loved the meals at Center for Community today! The service was excellent.'),
  (1, 2, 4, 'https://tse2.mm.bing.net/th?id=OIP.w6sKjjK0mW0CnG6WrqxJRwHaFW&pid=Api&P=0&h=220', 'Sewall Dining Center has great options, especially the vegetarian dishes.'),
  (1, 3, 3, 'https://tse3.mm.bing.net/th?id=OIP.ah_MDBRA66n2zG7zR4tm2wHaFS&pid=Api&P=0&h=220', 'Village Center Dining is decent, but could use more variety in desserts.');
