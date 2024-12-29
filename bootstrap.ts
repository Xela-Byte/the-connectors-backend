import { Router, Request, Response } from 'express';

const bootstrap = (router: Router, routes: Router): void => {
  router.use(`/`, routes); // Route all traffic with base endpoint.

  router.get('/', (req: Request, res: Response): void => {
    res.status(200).json({
      statusCode: 200,
      statusMessage: 'You touched The Connectors base route.',
    }); // Response for home route
  });
};

export default bootstrap;

