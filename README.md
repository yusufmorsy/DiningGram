# DiningGram
# CSCI 3308: Media Platform Group Project
## Contributors: Yusuf Morsy, Rodolfo Martinez-Maldonado, Luke Chabin, Andy Wood
## Brief Application description
As a website, DiningGram is a social media platform that revolves around the dining halls on campuses, such that it encourages college students to create a community-driven resource where they can discuss/highlight their most and least favorable aspects regarding their dining hall experience.

Through this website, students can:
 - Create posts and upload images to highlight their dining hall experiences.
 - Create comments to other posts, interacting with fellow users.
 - Save posts that they would like to see for later or to revisit.
 - Edit and tailor their profiles to their liking.
## Technology Stack used for the project
 - HTML
 - CSS
 - JavaScript
 - PostgreSQL using pg-promise
 - Chai
 - Chai-HTTP
 - JSON
 - Node.js
 - Express.js
 - Express-Handlebars
 - Body-Parser
 - Express-Session
 - Bcryptjs
 - Built-in FileReader API
## Prerequisites to run the application - Any software that needs to be installed to run the application
To run this application locally, install the following software:
 - Docker
## Instructions on how to run the application locally.
To run this locally, enter the directory that contains the `docker-compose.yaml` file. Keep in mind that you will need to create an `.env` file, containing the necssary credentials, before running this. It is important that your `.env` file is in the same directory as the `.yaml` file.

For this application, the local path for the yaml file is:
```
DiningGram/ProjectSourceCode/src
```
In this directory, assuming you have installed Docker, run the following:
```
docker compose up -d
```
## How to run the tests
To run the tests on your local repository, access the `docker-compose.yaml` file and adjust the following:
```
command: 'npm start'
```
To:
```
command: 'npm run testandrun'
```
Once you have done so, follow the instructions above to run the application locally, but compose your docker container using the following instead.
```
docker compose up
```
Removing the `-d` flag will allow you to see the pass/fail status of the tests in progress.

If you wish to, you may find the test cases within `server.spec.js` at the following:
```
DiningGram/ProjectSourceCode/src/test
```
## Link to the deployed application
In your browser, access the deployed application through the following:
```
http://localhost:3000/
```