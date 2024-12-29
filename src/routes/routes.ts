import express, { Request, Response, NextFunction } from 'express';
import {
  uploadFile,
  uploadMiddleware,
} from '../controllers/media/mediaController';

import { default as propertiesController } from '../controllers/properties/propertiesController';

const router = express.Router();

// Sample Code
// router.post('/wallet/sendToWallet', sendToWallet);

// Protected Route
// router.post('/auth/addUserLike', verifyToken, addUserLike);

// Properties
router.get('/properties', (req: Request, res: Response) => {
  propertiesController.getAllProperties(req, res);
});

router.get('/properties/:categoryName', (req: Request, res: Response) => {
  propertiesController.getAllPropertiesByCategory(req, res);
});

router.post(
  '/properties/create',
  propertiesController.propertyMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    propertiesController.addProperty(req, res, next);
  },
);

router.get('/property/:propertyID', (req: Request, res: Response) => {
  propertiesController.getSingleProperty(req, res);
});

router.put(
  '/properties/:propertyID',
  propertiesController.propertyMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    propertiesController.updateProperty(req, res, next);
  },
);

router.delete('/properties/:propertyID', (req: Request, res: Response) => {
  propertiesController.deleteProperty(req, res);
});

// Media
router.post('/uploadImage', uploadMiddleware, uploadFile);

export default router;

