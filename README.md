# Getting Started: Setup, Run & Test Guide
In order to run the project, we need to start by setting up important libraries and environment variables required for running the project.

## Setup
1. Start by cloning the repository to your local machine.
2. Navigate to the `frontend` directory, and run `npm install`.
3. Make sure that `.env` file exists in the `frontend` directory with the `REACT_APP_BACKEND_URL` set to `http://localhost:3001`(the URL on which the backend server is running).
4. Navigate to the `backend` directory, and run `npm install`.
5. Make sure that `.env` file exists in the `backend` directory with all the required AUTH0 secrets and credentials provided in the provided `.env`. These variables are required for authentication to work.

## Running the Project
1. Navigate to the `backend` directory on a terminal and run the command `npm run dev`.
2. Open a new terminal and navigate to the `frontend` directory and run the command `npm run dev`.
3. The frontend server will now be running on `http://localhost:3000`, which can be opened in the browser.

## Running the Tests
Navigate to the `frontend` directory on the terminal, and run `npm test`, which will run the frontend and run the e2e tests in a headless mode using `cypress run`.
