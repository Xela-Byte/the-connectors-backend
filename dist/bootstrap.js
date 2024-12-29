"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap = (router, routes) => {
    router.use(`/`, routes); // Route all traffic with base endpoint.
    router.get('/', (req, res) => {
        res.status(200).json({
            statusCode: 200,
            statusMessage: 'You touched The Connectors base route.',
        }); // Response for home route
    });
};
exports.default = bootstrap;
