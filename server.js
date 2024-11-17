const cors = require('cors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const { connectToDB } = require('./config/database');
const bootstrap = require('./bootstrap');
const { errorProcessing } = require('./middlewares/errorHandling');

const app = express();
const router = express.Router();

const server = http.createServer(app);

const frontURL = 'http://localhost:3000';

const corsOptions = {
  origin: frontURL,
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(router);

const routes = require(`./routes/routes`);

bootstrap(router, routes);

//Handle invalid endpoint
app.use((_, __, next) => {
  next({
    errorCode: 404,
    errorMessage: {
      statusCode: 404,
      message: 'Invalid Endpoint.',
    },
  });
});

app.use((error, request, response, next) => {
  if (error instanceof Error) error = errorProcessing(error);
  const statusCode = error.errorCode ? error.errorCode : 500;
  const statusMessage = error.errorMessage
    ? error.errorMessage
    : { error: { message: 'Internal server error.' } };
  // if status code is 500, log error to error.log file.
  response.status(parseInt(statusCode)).json(statusMessage);
});

const PORT = process.env.PORT || 5000;

const setUpServer = () => {
  connectToDB('theConnectors', () => {
    server.listen(PORT, () => {
      console.log(`Connected to port ${PORT} sucessfully`);
    });
  });
};

setUpServer();

