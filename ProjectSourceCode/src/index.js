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

// For file uploads of larger files
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.json({ limit: "10mb" }));

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

hbs.handlebars.registerHelper('eq', function(a, b) {
  return a === b;
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

// Initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret_key', // Ensure you set a secure secret in production
    saveUninitialized: false,
    resave: false,
  })
);

// Parse incoming requests with JSON payloads
app.use(express.json());

// Parse URL-encoded bodies (as sent by HTML forms)
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

// Middleware to ensure user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session?.user) {
    return next();
  }

  // Check if the request is an AJAX request
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  } else {
    res.redirect('/login');
  }
}

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
      //return res.status(400).json({ message: 'Username and password are required.' });
      return res.render('pages/register', {
        message: "Username and password are required.",
        error: true,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.none('INSERT INTO users(username, hashed_password) VALUES($1, $2)', [username, hashedPassword]);

    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);

    if (error.code === '23505') { // Unique violation in PostgreSQL
      //return res.status(409).json({ message: 'Username already exists.' });
      return res.render('pages/register', {
        message: "Username already exists.",
        error: true,
      });
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
      return res.render('pages/login', { message: 'Invalid Password. Please try again.', error: true });
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

// Create Post Route
app.get('/createpost', isAuthenticated, async (req, res) => {
  const allHalls = await db.any('SELECT * FROM dining_halls');
  res.render('pages/createpost', { title: 'Create a New Post', allHalls });
});

// Home Route with Filtering
app.get('/home', isAuthenticated, async (req, res) => {
  const filter = req.query.filter || 'all'; // Default filter is 'all'
  const currentUserId = req.session.user.user_id;

  try {
    let posts = [];
    let header = '';
    let averageRating = null; // Initialize averageRating

    // Base query components
    const baseSelect = `
      SELECT 
        p.post_id,
        p.post_content,
        p.image_url AS post_image_url,
        p.hall_rating,
        p.likes AS post_likes,
        p.created_at,
        u.user_id,
        u.username,
        u.profile_pic_url,
        d.hall_name,
        d.image_url AS hall_image_url,
        d.hall_description,
        COALESCE(json_agg(
          json_build_object(
            'comment_id', c.comment_id,
            'comment_content', c.comment_content,
            'created_at', c.created_at,
            'username', cu.username
          ) ORDER BY c.created_at ASC
        ) FILTER (WHERE c.comment_id IS NOT NULL), '[]') AS comments
      FROM posts p
      JOIN users u ON p.poster_id = u.user_id
      JOIN dining_halls d ON p.reviewed_hall_id = d.hall_id
      LEFT JOIN comments c ON p.post_id = c.post_id
      LEFT JOIN users cu ON c.user_id = cu.user_id
    `;

    const groupBy = `
      GROUP BY 
        p.post_id, p.post_content, p.image_url, p.hall_rating, p.likes, p.created_at, u.user_id,
        u.username, u.profile_pic_url,
        d.hall_name, d.image_url, d.hall_description
    `;

    if (filter === 'all') {
      header = 'All Posts';
      posts = await db.any(`
        ${baseSelect}
        ${groupBy}
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
        ${baseSelect}
        WHERE d.hall_name = $1
        ${groupBy}
        ORDER BY p.created_at DESC
      `, [hallName]);

      // Fetch average rating for the dining hall
      const avgResult = await db.oneOrNone(`
        SELECT ROUND(AVG(hall_rating)::numeric, 1) AS average_rating
        FROM posts p
        JOIN dining_halls d ON p.reviewed_hall_id = d.hall_id
        WHERE d.hall_name = $1
      `, [hallName]);

      if (avgResult && avgResult.average_rating) {
        averageRating = avgResult.average_rating;
      }
    } else if (filter === 'saved') {
      header = 'Your Saved Posts';
      posts = await db.any(`
        ${baseSelect}
        JOIN liked_posts lp ON p.post_id = lp.post_id
        WHERE lp.user_id = $1
        ${groupBy}
        ORDER BY p.created_at DESC
      `, [currentUserId]);
    } else {
      // Unknown filter, default to 'all'
      header = 'All Posts';
      posts = await db.any(`
        ${baseSelect}
        ${groupBy}
        ORDER BY p.created_at DESC
      `);
    }

    // Render the 'home' template with posts, header, and averageRating
    res.render('pages/home', {
      title: 'Home',
      header,
      posts,
      currentFilter: filter,
      averageRating // Pass averageRating to the template
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to handle comment submission
app.post('/comment', isAuthenticated, async (req, res) => {
  const { post_id, comment_content } = req.body;
  const user_id = req.session.user.user_id;

  // Basic validation
  if (!post_id || !comment_content.trim()) {
    //return res.status(400).json({ success: false, message: 'Post ID and comment content are required.' });
    return res.render('pages/home', { message: 'Post ID and comment content are required.', error: true });
  }

  try {
    await db.none(
      'INSERT INTO comments(comment_content, post_id, user_id) VALUES($1, $2, $3)',
      [comment_content.trim(), post_id, user_id]
    );
    res.json({ success: true, message: 'Comment posted successfully.' });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to post comment. Please try again.' });
  }
});

app.get('/profile/:userId', async (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.session?.user?.user_id;

  try {
    // Fetch user details
    const user = await db.one('SELECT * FROM users WHERE user_id = $1', [userId]);

    // Fetch posts and associated comments for the user
    const posts = await db.any(`
      SELECT 
        p.post_id, p.image_url, p.post_content, p.likes, p.hall_rating, d.hall_name,
        COALESCE(json_agg(jsonb_build_object('username', u.username, 'comment_content', c.comment_content))
        FILTER (WHERE c.comment_id IS NOT NULL), '[]') AS comments
      FROM posts p
      LEFT JOIN dining_halls d ON p.reviewed_hall_id = d.hall_id
      LEFT JOIN comments c ON p.post_id = c.post_id
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE p.poster_id = $1
      GROUP BY p.post_id, d.hall_name
    `, [userId]);

    // Render profile page
    res.render('pages/profile', {
      userId,
      username: user.username,
      full_name: user.full_name || 'Anonymous User',
      profile_biography: user.profile_biography || 'No bio available.',
      profile_pic_url: user.profile_pic_url,
      posts: posts,
      isCurrentUser: currentUserId === parseInt(userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading profile.');
  }
});

app.get('/profile', (req, res) => {
  if (!req.session?.user) {
    return res.redirect('/login'); // Redirect to login if not logged in
  }
  res.redirect(`/profile/${req.session.user.user_id}`);
});

app.post('/profile/:userId/edit', async (req, res) => {
  const { userId } = req.params;
  const { fullName, bio, picture: profilePicture } = req.body;

  try {

    let existingProfilePicture = profilePicture;

    if (!profilePicture) {
      const result = await db.one(
        'SELECT profile_pic_url FROM users WHERE user_id = $1',
        [userId]
      );
      existingProfilePicture = result.profile_pic_url;
    }

    const query = `
      UPDATE users
      SET 
        full_name = $1,
        profile_biography = $2,
        profile_pic_url = $3
      WHERE user_id = $4
    `;
    
    await db.none(query, [
      fullName || null, 
      bio || null, 
      existingProfilePicture, 
      userId
    ]);

    console.log('Profile updated successfully');

    // Redirect back to the profile page
    res.redirect(`/profile/${userId}`);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send('Failed to update profile.');
  }
});

// Route to handle saving a post
app.post('/savepost', isAuthenticated, async (req, res) => {
  const { post_id } = req.body;
  const user_id = req.session.user.user_id;

  if (!post_id) {
    //return res.status(400).json({ success: false, message: 'Post ID is required.' });
    return res.render('pages/home', { message: 'Post ID is required.', error: true });
  }

  try {
    // Check if the post is already saved by the user
    const existing = await db.oneOrNone(
      'SELECT 1 FROM liked_posts WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );

    if (existing) {
      // Optionally, you can unsave the post or inform the user
      return res.json({ success: false, message: 'You have already saved this post.' });
    } else {
      // Save the post
      await db.none(
        'INSERT INTO liked_posts (user_id, post_id) VALUES ($1, $2)',
        [user_id, post_id]
      );
      res.json({ success: true, message: 'Post saved successfully.' });
    }
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ success: false, message: 'Failed to save post. Please try again.' });
  }

});


// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Create Post Submission Route
app.post('/createpost', isAuthenticated, async (req, res) => {
  const { picture, bio, location, rating } = req.body; // Find a way to do rating

  try {
    const user_id = req.session.user.user_id;

    await db.none(
      'INSERT INTO posts(poster_id, reviewed_hall_id, hall_rating, image_url, post_content) VALUES($1, $2, $3, $4, $5)',
      [user_id, location, rating, picture, bio]
    );

    res.redirect('/home');
  } catch (error) {
    console.error('Error creating post:', error);
    const allHalls = await db.any('SELECT * FROM dining_halls');
    return res.render('pages/createpost', {
      message: "An error occurred. Please try again.",
      error: true,
      allHalls,
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
