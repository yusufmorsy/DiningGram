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
          return res.render('pages/login', { message: 'Incorrect username or password.', error: true });
      }

      req.session.user = user;
      req.session.save(() => {
          res.redirect('/discover');
      });
  } catch (error) {
      console.error('Error during login:', error);
      res.render('pages/login', { message: 'Login failed. Please try again.', error: true });
  }
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

module.exports = app.listen(3000);