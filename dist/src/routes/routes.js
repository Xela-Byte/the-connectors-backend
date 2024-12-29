"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const express_1 = __importDefault(require("express"));
const propertiesController_1 = __importDefault(require("../controllers/properties/propertiesController"));
const router = express_1.default.Router();
// Sample Code
// router.post('/wallet/sendToWallet', sendToWallet);
// Protected Route
// router.post('/auth/addUserLike', verifyToken, addUserLike);
// Properties
router.get('/properties', (req, res) => {
    propertiesController_1.default.getAllProperties(req, res);
});
router.get('/properties/:categoryName', (req, res) => {
    propertiesController_1.default.getAllPropertiesByCategory(req, res);
});
router.post('/properties/create', propertiesController_1.default.propertyMiddleware, (req, res, next) => {
    propertiesController_1.default.addProperty(req, res, next);
});
router.get('/property/:propertyID', (req, res) => {
    propertiesController_1.default.getSingleProperty(req, res);
});
router.put('/properties/:propertyID', propertiesController_1.default.propertyMiddleware, (req, res, next) => {
    propertiesController_1.default.updateProperty(req, res, next);
});
router.delete('/properties/:propertyID', (req, res) => {
    propertiesController_1.default.deleteProperty(req, res);
});
exports.default = router;
