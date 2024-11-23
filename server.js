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

const whitelist = ['http://localhost:5173', 'http://localhost:3000'];

server.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-xsrf-token',
  }),
);

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

