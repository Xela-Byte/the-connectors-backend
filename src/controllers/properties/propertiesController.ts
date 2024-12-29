import { Request, Response, NextFunction } from 'express';

import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFileToFTP } from '../../core/ftpUploader';
import mongoose from 'mongoose';
import { Property } from '../../models/Property';

// Multer setup for file uploads
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir); // Temporary storage before FTP upload
  },
  filename: (req, file, cb) => {
    const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedFileName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Middleware for handling file uploads
const propertyMiddleware = upload.single('flyerImage');

// Get All Properties
const getAllProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const searchQuery = (req.query.search as string) || '';

    const searchCriteria = searchQuery
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { category: { $regex: searchQuery, $options: 'i' } },
            { location: { $regex: searchQuery, $options: 'i' } },
          ],
        }
      : {};

    const totalFilteredProperties =
      await Property.countDocuments(searchCriteria);
    const totalProperties = await Property.countDocuments();
    const skip = (page - 1) * 10;

    const properties = await Property.find(searchCriteria)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(10);

    const totalPages = Math.ceil(totalFilteredProperties / 10);

    return res.status(200).json({
      statusCode: 200,
      data: properties,
      currentPage: page,
      totalPages,
      totalLength: searchQuery ? totalFilteredProperties : totalProperties,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ statusCode: 500, message: 'Internal Server Error' });
  }
};

const getAllPropertiesByCategory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit;

    // Extract and sanitize inputs
    const categoryName = (req.params.categoryName || '').toLowerCase();
    const searchQuery = req.query.search || '';

    // Validate required parameter: categoryName
    if (!categoryName) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Category name is required',
      });
    }

    // Build the base search criteria (category filter)
    const searchCriteria: any = {
      category: { $regex: categoryName, $options: 'i' },
    };

    // If a search query is provided, add additional filters
    if (searchQuery) {
      searchCriteria.$or = [
        { location: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // Fetch data in parallel
    const [totalFilteredProperties, properties] = await Promise.all([
      Property.countDocuments(searchCriteria),
      Property.find(searchCriteria)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalFilteredProperties / limit);

    // Send response
    return res.status(200).json({
      statusCode: 200,
      data: properties,
      currentPage: page,
      totalPages,
      totalLength: totalFilteredProperties,
    });
  } catch (err) {
    console.error('Error fetching properties:', err);
    return res
      .status(500)
      .json({ statusCode: 500, message: 'Internal Server Error' });
  }
};

// Get Single Property
const getSingleProperty = async (req: Request, res: Response) => {
  try {
    const { propertyID } = req.params;

    if (!propertyID)
      return res.status(400).json({ message: 'Please provide property ID.' });

    if (!mongoose.Types.ObjectId.isValid(propertyID))
      return res.status(400).json({ message: 'Invalid Property ID.' });

    const property = await Property.findById(propertyID);

    if (!property)
      return res.status(400).json({ message: 'Property not found.' });

    return res.status(200).json({ message: 'Property found.', data: property });
  } catch (err) {
    return res
      .status(500)
      .json({ statusCode: 500, message: 'Internal Server Error' });
  }
};

// Add Property Controller
const addProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const { name, location, pricing, features, category } = payload;
    const flyerImage = req.file;

    // Validation
    if (!flyerImage)
      return res.status(400).json({ error: 'Please provide a flyer image.' });
    if (!name)
      return res.status(400).json({ error: 'Please provide property name.' });
    if (!location)
      return res
        .status(400)
        .json({ error: 'Please provide property location.' });
    if (!pricing)
      return res
        .status(400)
        .json({ error: 'Please provide property pricing.' });
    if (!features)
      return res
        .status(400)
        .json({ error: 'Please provide property features.' });
    if (!category)
      return res
        .status(400)
        .json({ error: 'Please provide property category.' });

    // Parse JSON field
    let parsedPricing;
    let parsedFeatures;

    let slug = payload.name.replace(/\s+/g, '-').toLowerCase();

    try {
      parsedPricing = JSON.parse(pricing);
      parsedFeatures = JSON.parse(features);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Invalid JSON format for pricing or features.',
        details: error.message,
      });
    }

    // FTP upload
    const uploadResult = await uploadFileToFTP(flyerImage);

    if (uploadResult.success) {
      const newProperty = new Property({
        ...payload,
        pricing: parsedPricing,
        features: parsedFeatures,
        flyerImage: uploadResult.url,
        slug,
      });
      await newProperty.save();

      return res.status(200).json({
        message: 'Property created successfully',
        data: newProperty,
      });
    } else {
      return res
        .status(500)
        .json({ error: 'FTP upload failed.', details: uploadResult.error });
    }
  } catch (e) {
    next(e);
  }
};
// Update Property
const updateProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { propertyID } = req.params;
    let payload = req.body;
    const flyerImage = req.file;

    if (!propertyID)
      return res.status(400).json({ message: 'Please provide property ID.' });

    if (!mongoose.Types.ObjectId.isValid(propertyID))
      return res.status(400).json({ message: 'Invalid Property ID.' });

    const property = await Property.findById(propertyID);

    if (!property)
      return res.status(400).json({ message: 'Property not found.' });

    if (flyerImage) {
      const uploadResult = await uploadFileToFTP(flyerImage);
      if (!uploadResult.success) {
        return res
          .status(500)
          .json({ error: 'FTP upload failed.', details: uploadResult.error });
      }
      payload.flyerImage = uploadResult.url;
    }

    if (payload.name) {
      let slug = payload.name.replace(/\s+/g, '-').toLowerCase();
      payload = {
        ...payload,
        slug,
      };
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      propertyID,
      payload,
      {
        new: true,
        runValidators: true,
      },
    );

    return res
      .status(200)
      .json({ message: 'Property updated.', data: updatedProperty });
  } catch (e) {
    next(e);
  }
};

// Delete Property
const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { propertyID } = req.params;

    if (!propertyID)
      return res.status(400).json({ message: 'Please provide property ID.' });

    if (!mongoose.Types.ObjectId.isValid(propertyID))
      return res.status(400).json({ message: 'Invalid Property ID.' });

    const property = await Property.findById(propertyID);

    if (!property)
      return res.status(400).json({ message: 'Property not found.' });

    await Property.findByIdAndDelete(propertyID);
    return res
      .status(200)
      .json({ message: 'Property deleted.', data: property });
  } catch (err) {
    return res
      .status(500)
      .json({ statusCode: 500, message: 'Internal Server Error' });
  }
};

export default {
  propertyMiddleware,
  addProperty,
  getAllProperties,
  getAllPropertiesByCategory,
  getSingleProperty,
  updateProperty,
  deleteProperty,
};

