# DiningGram
# CSCI 3308: Media Platform Group Project
## Contributors: Yusuf Morsy, Rodolfo Martinez-Maldonado, Luke Chabin, Andy Wood

Initial Structure:

Front-end: Luke and Andy

Back-end: Yusuf and Rodolfo

## Brief Application description
Add text here
## Technology Stack used for the project
Add text here
## Prerequisites to run the application - Any software that needs to be installed to run the application
To run this application, install Docker.
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
`command: 'npm start'`
To
`command: 'npm run testandrun'`

Once you have done so, follow the instructions above to run the application locally, but compose your docker container using the following instead.
```
docker compose up
```
Removing the `-d` flag will allow you to see the pass/fail status of the tests in progress.
## Link to the deployed application
In your browser, access the deployed application through the following:
```
http://localhost:3000/
```