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