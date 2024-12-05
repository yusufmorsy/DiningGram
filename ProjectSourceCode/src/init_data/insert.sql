--hall_id is automatically due to SERIAL constraint
--avg_rating is given default of 0
INSERT INTO dining_halls
  (hall_name, image_url, hall_description)
VALUES
  ('Center for Community', 'https://tse3.mm.bing.net/th?id=OIP.ugns5levBrjiVcXsTiBDaAHaEK&pid=Api&P=0&h=220', 'Paradise for freshmen and everyone who needs a snack.'),
  ('Sewall Dining Center','https://tse2.mm.bing.net/th?id=OIP.w6sKjjK0mW0CnG6WrqxJRwHaFW&pid=Api&P=0&h=220','Gorgeous interior and delicious food. A shame that it is near the recreation center and far away for most dorms.'),
  ('Village Center Dining','https://tse3.mm.bing.net/th?id=OIP.ah_MDBRA66n2zG7zR4tm2wHaFS&pid=Api&P=0&h=220','Luxurious dining hall with a balcony looking towards the mountains (if I remember correctly).');

--Test dummy user; delete upon production
INSERT INTO users
  (username, full_name, email_address, hashed_password, profile_biography, profile_pic_url)
VALUES
  ('Spider-Man', 'Peter Parker', 'example1@gmail.com','totally_hashed','Your Friendly Neighborhood Spider-Man', 'https://tse2.mm.bing.net/th?id=OIP.SKbY5YEISFnQ5FFxRJ5GOwHaEK&pid=Api&P=0&h=220'),
  ('batman', 'bruce wayne', 'bruce@gmail.com', 'hashed', 'best superhero', 'https://tse2.mm.bing.net/th?id=OIP.xBDqrL_KgYHj-VeCQertFwHaE8&pid=Api&P=0&h=220');

INSERT INTO posts (poster_id, reviewed_hall_id, hall_rating, image_url, post_content)
VALUES
  (1, 1, 5, 'https://tse3.mm.bing.net/th?id=OIP.ugns5levBrjiVcXsTiBDaAHaEK&pid=Api&P=0&h=220', 'Absolutely loved the meals at Center for Community today! The service was excellent.'),
  (1, 2, 4, 'https://tse2.mm.bing.net/th?id=OIP.w6sKjjK0mW0CnG6WrqxJRwHaFW&pid=Api&P=0&h=220', 'Sewall Dining Center has great options, especially the vegetarian dishes.'),
  (1, 3, 3, 'https://tse3.mm.bing.net/th?id=OIP.ah_MDBRA66n2zG7zR4tm2wHaFS&pid=Api&P=0&h=220', 'Village Center Dining is decent, but could use more variety in desserts.');

INSERT INTO comments (comment_content, post_id, user_id)
VALUES
  ('i completely disagree with that', 1, 2);