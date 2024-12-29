"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const URI = process.env.MONGO_URI || '';
const connectToDB = (dbName, server) => {
    mongoose_1.default.set('strictQuery', false);
    mongoose_1.default
        .connect(URI)
        .then(() => {
        console.log(`Connected to ${dbName} DB successfully`);
    })
        .then(() => {
        server();
    })
        .catch((err) => {
        console.error(err);
    });
};
exports.connectToDB = connectToDB;
