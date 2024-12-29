import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { connectToDB } from './src/config/database';
import bootstrap from './bootstrap';
import errorHandlingModule from './src/middlewares/errorHandling';
import routes from './src/routes/routes';

dotenv.config();

const app = express();
const router = express.Router();
const server = http.createServer(app);

const whitelist: string[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.blog.theconnectorsng.com',
  'https://www.media.theconnectorsng.com',
  'https://www.theconnectorsng.com',
];

// Configure CORS
app.use(
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
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-xsrf-token',
    ].join(', '),
  }),
);

// Middleware for parsing JSON
app.use(express.json());
app.use(router);

// Bootstrapping routes
bootstrap(router, routes);

// Handle invalid endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  next({
    errorCode: 404,
    errorMessage: {
      statusCode: 404,
      message: 'Invalid Endpoint.',
    },
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof Error)
    error = errorHandlingModule.errorProcessing(error);
  const statusCode = error.errorCode ? error.errorCode : 500;
  const statusMessage = error.errorMessage
    ? error.errorMessage
    : { error: { message: 'Internal server error.' } };

  res.status(parseInt(statusCode, 10)).json(statusMessage);
});

const PORT = process.env.PORT || 5000;

const setUpServer = () => {
  connectToDB('theConnectors', () => {
    server.listen(PORT, () => {
      console.log(`Connected to port ${PORT} successfully`);
    });
  });
};

setUpServer();

