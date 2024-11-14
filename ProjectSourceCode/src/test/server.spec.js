// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

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
        expect(res).to.redirectTo(/\/login$/); // Optionally check the redirect URL
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