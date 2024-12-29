"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// @ts-ignore
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const database_1 = require("./src/config/database");
const bootstrap_1 = __importDefault(require("./bootstrap"));
const errorHandling_1 = __importDefault(require("./src/middlewares/errorHandling"));
const routes_1 = __importDefault(require("./src/routes/routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const router = express_1.default.Router();
const server = http_1.default.createServer(app);
const whitelist = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://www.blog.theconnectorsng.com',
    'https://www.media.theconnectorsng.com',
    'https://www.theconnectorsng.com',
];
// Configure CORS
app.use((0, cors_1.default)({
    credentials: true,
    origin: (origin, callback) => {
        if (!origin || whitelist.includes(origin)) {
            callback(null, true);
        }
        else {
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
}));
// Middleware for parsing JSON
app.use(express_1.default.json());
app.use(router);
// Bootstrapping routes
(0, bootstrap_1.default)(router, routes_1.default);
// Handle invalid endpoints
app.use((req, res, next) => {
    next({
        errorCode: 404,
        errorMessage: {
            statusCode: 404,
            message: 'Invalid Endpoint.',
        },
    });
});
// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof Error)
        error = errorHandling_1.default.errorProcessing(error);
    const statusCode = error.errorCode ? error.errorCode : 500;
    const statusMessage = error.errorMessage
        ? error.errorMessage
        : { error: { message: 'Internal server error.' } };
    res.status(parseInt(statusCode, 10)).json(statusMessage);
});
const PORT = process.env.PORT || 5000;
const setUpServer = () => {
    (0, database_1.connectToDB)('theConnectors', () => {
        server.listen(PORT, () => {
            console.log(`Connected to port ${PORT} successfully`);
        });
    });
};
setUpServer();
