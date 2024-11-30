// Dependencies
const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object.
const bcrypt = require('bcryptjs'); // To hash passwords
const axios = require('axios'); // To make HTTP requests from our server.

// Create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

// Register Handlebars helpers
hbs.handlebars.registerHelper('range', function(start, end) {
  let result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
});

hbs.handlebars.registerHelper('lte', function(a, b) {
  return a <= b;
});

// Optional: JSON helper for debugging
hbs.handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context, null, 2);
});

hbs.handlebars.registerHelper('range', function(start, end) {
  let result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
});

hbs.handlebars.registerHelper('lte', function(a, b) {
  return a <= b;
});

hbs.handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Optional: JSON helper for debugging
hbs.handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context, null, 2);
});

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST, // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// Test your database connection
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// Setting up App

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// Initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret_key', // Ensure you set a secure secret in production
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Middleware to set local variables
app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session?.user; // Convert to boolean
  next();
});

// Routes

app.get('/', (req, res) => {
  res.render('pages/register');
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

// Registration Route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.none('INSERT INTO users(username, hashed_password) VALUES($1, $2)', [username, hashedPassword]);

    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);

    if (error.code === '23505') { // Unique violation in PostgreSQL
      return res.status(409).json({ message: 'Username already exists.' });
    }

    res.status(500).json({ message: 'Registration failed. Please try again.', error: true });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);

    if (!user) {
      return res.redirect('/register');
    }

    const match = await bcrypt.compare(req.body.password, user.hashed_password);

    if (!match) {
      return res.render('pages/login');
    }

    req.session.user = user;
    req.session.save(() => {
      res.redirect('/home');
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.render('pages/login', { message: 'Login failed. Please try again.', error: true });
  }
});

// Welcome Route (for testing)
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

// Create Post Route
app.get('/createpost', async (req, res) => {
  const allHalls = await db.any('SELECT * FROM dining_halls');
  res.render('pages/createpost', { title: 'Create a New Post', allHalls });
});


// Home Route
// Home Route with Filtering
app.get('/home', async (req, res) => {
  if (!req.session?.user) {
    console.log('User not logged in. Redirecting to /login.');
    return res.redirect('/login'); // Redirect if not logged in
  }

  const filter = req.query.filter || 'all'; // Default filter is 'all'
  const currentUserId = req.session.user.user_id;

  try {
    let posts = [];
    let header = '';

    if (filter === 'all') {
      header = 'All Posts';
      posts = await db.any(`
      SELECT 
      p.post_id,
      p.post_content,
      p.image_url AS post_image_url,
      p.hall_rating,
      p.likes AS post_likes,
      p.created_at,
      u.username,
      u.profile_pic_url,
      d.hall_name,
      d.image_url AS hall_image_url,
      d.hall_description
    FROM posts p
    JOIN users u ON p.poster_id = u.user_id
    JOIN dining_halls d ON p.reviewed_hall_id = d.hall_id
    ORDER BY p.created_at DESC 
      `);
    } else if (['c4c', 'sewall', 'village_center'].includes(filter)) {
      // Mapping filter values to dining hall names
      const hallNameMap = {
        'c4c': 'Center for Community',
        'sewall': 'Sewall Dining Center',
        'village_center': 'Village Center Dining'
      };

      const hallName = hallNameMap[filter];

      header = `${hallName} Posts`;
      posts = await db.any(`
        SELECT 
          p.post_id,
          p.post_content,
          p.image_url AS post_image_url,
          p.hall_rating,
          p.likes AS post_likes,
          p.created_at,
          u.username,
          u.profile_pic_url,
          d.hall_name,
          d.image_url AS hall_image_url,
          d.hall_description
        FROM posts p
        JOIN users u ON p.poster_id = u.user_id
        JOIN dining_halls d ON p.reviewed_hall_id = d.hall_id
        WHERE d.hall_name = $1
        ORDER BY p.created_at DESC
      `, [hallName]);
    } else if (filter === 'saved') {
      header = 'Saved Posts';
      posts = await db.any(`
        SELECT 
          p.post_id,
          p.post_content,
          p.image_url AS post_image_url,
          p.hall_rating,
          p.likes AS post_likes,
          p.created_at,
          u.username,
          u.profile_pic_url,
          d.location AS hall_location,
          d.hall_name,
          d.image_url AS hall_image_url,
          d.hall_description
        FROM posts p
        JOIN users u ON p.poster_id = u.user_id
        JOIN dining_halls d ON p.reviewed_hall_id = d.hall_id
        JOIN liked_posts lp ON p.post_id = lp.post_id
        WHERE lp.user_id = $1
        ORDER BY p.created_at DESC
      `, [currentUserId]);
    } else {
      // Unknown filter, default to 'all'
      header = 'All Posts';
      posts = await db.any(`
        SELECT 
          p.post_id,
          p.post_content,
          p.image_url AS post_image_url,
          p.hall_rating,
          p.likes AS post_likes,
          p.created_at,
          u.username,
          u.profile_pic_url,
          d.location AS hall_location, 
          d.hall_name,
          d.image_url AS hall_image_url,
          d.hall_description
        FROM posts p
        JOIN users u ON p.poster_id = u.user_id
        JOIN dining_halls d ON p.reviewed_hall_id = d.hall_id
        ORDER BY p.created_at DESC
      `);
    }

    console.log(`Fetched ${posts.length} posts for filter '${filter}' from the database.`);
    // console.log('Sample Post:', posts[0]);

    res.render('pages/home', { 
      posts, 
      title: 'Home', 
      header, 
      currentFilter: filter 
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).render('pages/home', { 
      message: "Unable to load posts.", 
      error: true, 
      title: 'Home',
      header: 'Error',
      currentFilter: 'all'
    });
  }
});

// Middleware to ensure user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session?.user) {
    return next();
  }
  res.redirect('/login');
}

// Route to handle comment submission
app.post('/comment', isAuthenticated, async (req, res) => {
  const { post_id, comment_content } = req.body;
  const user_id = req.session.user.user_id;

  // Basic validation
  if (!post_id || !comment_content.trim()) {
    return res.status(400).json({ success: false, message: 'Post ID and comment content are required.' });
  }

  try {
    await db.none(
      'INSERT INTO comments(post_id, user_id, comment_content) VALUES($1, $2, $3)',
      [post_id, user_id, comment_content.trim()]
    );
    res.status(201).json({ success: true, message: 'Comment posted successfully.' });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to post comment. Please try again.' });
  }
});

app.get('/profile', (req, res) => {
  res.render('/profile');
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Create Post Submission Route
app.post('/createpost', async (req, res) => {
  const { picture, bio, location, rating } = req.body; //Find a way to do rating

  try {
    const allHalls = await db.any('SELECT * FROM dining_halls');
    // Ensure the user is logged in
    if (!req.session.user) {
      return res.render('pages/createpost', {
        message: "Please Log In",
        allHalls,
        error: true,
      });
    }

    // Extract user id from the session
    const user_id = req.session.user.user_id;

    console.log('Check location value: ', location);
    // Find the dining hall id
    const find_hall = await db.oneOrNone(
      'SELECT * FROM dining_halls WHERE hall_name = $1',
      [location]
    );

    // Invalid Hall name
    // if (!find_hall) {
    //   return res.render('pages/createpost', {
    //     message: "Invalid Dining Hall",
    //     allHalls,
    //     error: true,
    //   });
    // }

    console.log('Check rating value: ', rating);

    await db.none(
      'INSERT INTO posts(poster_id, reviewed_hall_id, hall_rating, image_url, post_content) VALUES($1, $2, $3, $4, $5)',
      [user_id, find_hall.hall_id, rating, picture, bio]
    );

    res.redirect('/home');
  } catch (error) {
    console.error('Error creating post:', error);
    return res.render('pages/home', {
      message: "An error occurred. Please try again.",
      error: true
    });
  }
});

// Serve Static Files
app.use(express.static('public'));

// Start the Server
const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
module.exports = { server, db };
