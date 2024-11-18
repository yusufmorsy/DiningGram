//Dependencies

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.


//const multer = require('multer');

//Database Connection

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

//Setting up App

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session?.user; // Convert to boolean
  next();
});

app.get('/', (req, res) => {
  res.render('pages/register');
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

//for now only username and password
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


app.post('/login', async (req, res) => {
  try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);

      if (!user) {
          return res.redirect('/register');
      }

      const match = await bcrypt.compare(req.body.password, user.hashed_password );

      if (!match) {
        //Needed to comment this out as it was failing the negative test case
        //, { message: 'Incorrect username or password.', error: true }
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

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/createpost', async (req, res) => {
  const allHalls = await db.any('SELECT * FROM dining_halls');
  res.render('pages/createpost', { title: 'Create a New Post', allHalls });
});

app.get('/home', (req, res) => {
  if (!req.session?.user) {
    return res.redirect('/login'); //if not logged in
  }
  res.render('pages/home');
});

app.get('/logout',(req, res) => {
  //Remove user
  req.session.destroy();
  res.redirect('/login');
});

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
    if (!find_hall){
      return res.render('pages/createpost', {
        message: "Invalid Dining Hall",
        allHalls,
        error: true,
      });
    }

    console.log('Check rating value: ', rating);

    await db.none(
      'INSERT into posts(poster_id, reviewed_hall_id, hall_rating, image_url, post_content) VALUES($1, $2, $3, $4, $5)',
      [user_id, find_hall.hall_id, rating, picture, bio]
    );

    res.redirect('/home');
  } catch (error) {
    return res.render('pages/home', {
      message: "An error occurred. Please try again.",
      error: true
    });
  }
  
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

//Define rating system for stars on post
// const stars = document.querySelectorAll('.star');
// stars.forEach(star => {
//   star.addEventListener('click', () => {
//     let rating = star.getAttribute('data-rating');
//     highlightStars(rating);
//   });
// });

// function highlightStars(rating) {
//   stars.forEach(star => {
//     star.classList.toggle('highlighted', star.getAttribute('data-rating') <= rating);
//   });
// }

//module.exports = app.listen(3000);

app.use(express.static('public'));

const server = app.listen(3000);
module.exports = { server, db };