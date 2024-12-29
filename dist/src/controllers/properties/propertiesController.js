"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ftpUploader_1 = require("../../core/ftpUploader");
const mongoose_1 = __importDefault(require("mongoose"));
const Property_1 = require("../../models/Property");
// Multer setup for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path_1.default.join(__dirname, '../../tmp');
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir); // Temporary storage before FTP upload
    },
    filename: (req, file, cb) => {
        const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
        const uniqueName = `${Date.now()}-${sanitizedFileName}`;
        cb(null, uniqueName);
    },
});
const upload = (0, multer_1.default)({ storage });
// Middleware for handling file uploads
const propertyMiddleware = upload.single('flyerImage');
// Get All Properties
const getAllProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const searchQuery = req.query.search || '';
        const searchCriteria = searchQuery
            ? {
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { category: { $regex: searchQuery, $options: 'i' } },
                    { location: { $regex: searchQuery, $options: 'i' } },
                ],
            }
            : {};
        const totalFilteredProperties = await Property_1.Property.countDocuments(searchCriteria);
        const totalProperties = await Property_1.Property.countDocuments();
        const skip = (page - 1) * 10;
        const properties = await Property_1.Property.find(searchCriteria)
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
    }
    catch (err) {
        return res
            .status(500)
            .json({ statusCode: 500, message: 'Internal Server Error' });
    }
};
const getAllPropertiesByCategory = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
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
        const searchCriteria = {
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
            Property_1.Property.countDocuments(searchCriteria),
            Property_1.Property.find(searchCriteria)
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
    }
    catch (err) {
        console.error('Error fetching properties:', err);
        return res
            .status(500)
            .json({ statusCode: 500, message: 'Internal Server Error' });
    }
};
// Get Single Property
const getSingleProperty = async (req, res) => {
    try {
        const { propertyID } = req.params;
        if (!propertyID)
            return res.status(400).json({ message: 'Please provide property ID.' });
        if (!mongoose_1.default.Types.ObjectId.isValid(propertyID))
            return res.status(400).json({ message: 'Invalid Property ID.' });
        const property = await Property_1.Property.findById(propertyID);
        if (!property)
            return res.status(400).json({ message: 'Property not found.' });
        return res.status(200).json({ message: 'Property found.', data: property });
    }
    catch (err) {
        return res
            .status(500)
            .json({ statusCode: 500, message: 'Internal Server Error' });
    }
};
// Add Property Controller
const addProperty = async (req, res, next) => {
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
        }
        catch (error) {
            return res.status(400).json({
                error: 'Invalid JSON format for pricing or features.',
                details: error.message,
            });
        }
        // FTP upload
        const uploadResult = await (0, ftpUploader_1.uploadFileToFTP)(flyerImage);
        if (uploadResult.success) {
            const newProperty = new Property_1.Property({
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
        }
        else {
            return res
                .status(500)
                .json({ error: 'FTP upload failed.', details: uploadResult.error });
        }
    }
    catch (e) {
        next(e);
    }
};
// Update Property
const updateProperty = async (req, res, next) => {
    try {
        const { propertyID } = req.params;
        let payload = req.body;
        const flyerImage = req.file;
        if (!propertyID)
            return res.status(400).json({ message: 'Please provide property ID.' });
        if (!mongoose_1.default.Types.ObjectId.isValid(propertyID))
            return res.status(400).json({ message: 'Invalid Property ID.' });
        const property = await Property_1.Property.findById(propertyID);
        if (!property)
            return res.status(400).json({ message: 'Property not found.' });
        if (flyerImage) {
            const uploadResult = await (0, ftpUploader_1.uploadFileToFTP)(flyerImage);
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
        const updatedProperty = await Property_1.Property.findByIdAndUpdate(propertyID, payload, {
            new: true,
            runValidators: true,
        });
        return res
            .status(200)
            .json({ message: 'Property updated.', data: updatedProperty });
    }
    catch (e) {
        next(e);
    }
};
// Delete Property
const deleteProperty = async (req, res) => {
    try {
        const { propertyID } = req.params;
        if (!propertyID)
            return res.status(400).json({ message: 'Please provide property ID.' });
        if (!mongoose_1.default.Types.ObjectId.isValid(propertyID))
            return res.status(400).json({ message: 'Invalid Property ID.' });
        const property = await Property_1.Property.findById(propertyID);
        if (!property)
            return res.status(400).json({ message: 'Property not found.' });
        await Property_1.Property.findByIdAndDelete(propertyID);
        return res
            .status(200)
            .json({ message: 'Property deleted.', data: property });
    }
    catch (err) {
        return res
            .status(500)
            .json({ statusCode: 500, message: 'Internal Server Error' });
    }
};
exports.default = {
    propertyMiddleware,
    addProperty,
    getAllProperties,
    getAllPropertiesByCategory,
    getSingleProperty,
    updateProperty,
    deleteProperty,
};
