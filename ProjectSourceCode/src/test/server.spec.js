// ********************** Initialize server **********************************

const { server, db } = require('../index'); //TODO: Make sure the path to your index.js is correctly added
const bcrypt = require('bcryptjs'); // Ensure this path matches where bcrypt is installed

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

// describe('Server!', () => {
//   // Sample test case given to test / endpoint.
//   it('Returns the default welcome message', done => {
//     chai
//       .request(server)
//       .get('/welcome')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body.status).to.equals('success');
//         assert.strictEqual(res.body.message, 'Welcome!');
//         done();
//       });
//   });
// });

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
describe('Testing Register User API', () => {
  it('Positive : /register. Valid username and password', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: "yusufmorsy", password: "mynameisyusuf"}) // Changed field name
      .redirects(0) // Prevent following the redirect automatically
      .end((err, res) => {
        expect(res).to.have.status(302); // Expecting a redirect
        expect(res).to.redirectTo(/\/login$/);
        done();
      });
  });
  it('Negative : /register. Valid username but invalid password', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: "fakeAccount", password: ""})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Username and password are required.');
        done();
      });
  });
  it('Negative : /register. Valid password but invalid username', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: "", password: "invalidAccount"})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Username and password are required.');
        done();
      });
  });
});

// ********************************************************************************

describe('Testing Login User API', () => {
  const testUser = {
    username: 'testdummy',
    password: 'coolpassword',
  };

  before(async () => {
    //Insert test user
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await db.none('INSERT INTO users(username, hashed_password) VALUES($1, $2)', [
      testUser.username, 
      hashedPassword
    ]);
  });

  it('Positive : /login. Valid username and password', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: testUser.username, password: testUser.password})
      .redirects(0) // Prevent following the redirect automatically
      .end((err, res) => {
        expect(res).to.have.status(302); //Expecting a redirect
        expect(res).to.redirectTo(/\/home$/);
        done();
      });
  });
  it('Negative : /login. Valid username, but invalid password', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: testUser.username, password: "fakePassword"})
      .redirects(0) // Prevent following the redirect automatically
      .end((err, res) => {
        expect(res).to.have.status(200); //Expecting a render
        res.should.be.html; // Expecting a HTML response
        //expect(res.text).to.include('Incorrect username or password.');
        done();
      });
  });

  after(async () => {
    // Clean up the test user after tests
    await db.none('DELETE FROM users WHERE username = $1', [testUser.username]);
  });
});


// UAT Plan Implementation

describe('Testing Creating Post API', () => {
  // Image Address is to Spongbob Caveman meme
  const testPost = {
    picture: 'https://tse2.mm.bing.net/th?id=OIP.9Q2N0Hqgwrv2EIeFNHqyOgHaEG&pid=Api&P=0&h=220',
    bio: 'cout << Hello World! << endl',
    location: "1",
    rating: "5",
  };

  const testUser = {
    username: 'testdummyAgain',
    password: 'superCoolPassword',
  };

  let agent; // Ensuring req.session is maintained throughout these test cases
  let originalConsoleError; // Suppress intentional SQL error

  //Insert test user
  before(async () => {
    agent = chai.request.agent(server);
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await db.none('INSERT INTO users(username, hashed_password) VALUES($1, $2)', [
      testUser.username, 
      hashedPassword
    ]);
  });

  // Acts as user logging in to their account AND initializes req.session.user.user_id
  beforeEach(done => {
    originalConsoleError = console.error;
    console.error = () => {}; //Override error message
    // Log in as the newly created user
    agent
      .post('/login')
      .send({ username: testUser.username, password: testUser.password })
      .end((err, res) => {
        //console.log('Login response status:', res.status);
        expect(res).to.have.status(200); // Expect a redirect after successful login, THEN render (200)
        done();
      });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('Positive: /createpost. Valid post submission, redirects to /home GET route', done => {
    agent
      .post('/createpost')
      .send(testPost)
      .redirects(0) // Prevent following redirects
      .end((err, res) => {
        expect(res).to.have.status(302); // Expecting redirect to /home
        expect(res).to.redirectTo(/\/home$/);
        done();
      });
  });

  // SQL Query here will deliberately fail, so if console.error message appears for this, ignore it
  it('Negative: /createpost. Missing hall id, SQL query fails, re-renders createpost page', done => {
    agent
      .post('/createpost')
      .send({picture: testPost.picture, bio: testPost.bio, rating: testPost.rating})
      .redirects(0) // Prevent following redirects
      .end((err, res) => {
        expect(res).to.have.status(200); //Expecting a render
        res.should.be.html;
        done();
      });
  });

  after(async () => {
    // Clean up: Remove the test user after the tests
    await db.none('DELETE FROM users WHERE username = $1', [testUser.username]);

    // Close the agent to avoid session persistence across tests
    agent.close();
  });
});



/*


Feature 2: users can leave likes on posts

To test this feature, we will consider the following two test cases: the post was successfully liked and that it was not successfully liked. For the user acceptance criteria, given that the post exists, upon clicking the like button, the corresponding API route will update the column for the corresponding post in the posts table and increment the like value by 1.

Under the positive test case, the post will be successfully liked and the post from the posts table will be updated to include one more like once the button is submitted. This will be tested under the localhost environment. We expect the result to be a render of /home with the updated information of the post.

Under the negative test case, we will consider that the post doesn’t exist. Thus, we expect the action to like the post fails and render the /home as is, without updating the table.



Feature 3: a comment system under each post

To test this feature, we will consider the following two test cases: the comment was successfully created and that it was not successfully created. For the user acceptance criteria, given that the post exists, upon clicking the comment button, all of the following fields must be submitted:
- Name
- Comment description/content
Under the positive test case, the comment will be successfully created with the necessary fields and the comment will be stored in the comments table and linked to the posts table under the posts_to_comments table once the button is submitted. This will be tested under the localhost environment. We expect the result to be an updated render of /home with the comment included.

Under the negative test case, we will consider that the comment content was not submitted. Thus, we expect the action to create the comment fails and renders the /home page as is.

*/