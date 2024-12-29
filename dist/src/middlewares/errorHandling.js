"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
function errorProcessing(receivedErrorMessage) {
    console.log(receivedErrorMessage);
    // split the error response
    let errorMessage = receivedErrorMessage.message.split(':');
    errorMessage = errorMessage[1].split('|');
    let errorObject = errorMessage.length;
    // if no error code is provided. Call the _logger function to log error.
    if (errorObject <= 1)
        logErrorToFile(receivedErrorMessage);
    return {
        errorCode: errorObject > 1 ? parseInt(errorMessage[0].trim()) : 500,
        errorMessage: {
            statusCode: errorMessage ? Number(errorMessage[0].trim()) : 500,
            message: errorObject > 1 ? errorMessage[1] : 'Error Processing Request.',
        },
    };
}
function errorHandling(receivedErrorMessage) {
    throw new Error(receivedErrorMessage);
}
function logErrorToFile(receivedErrorMessage) {
    console.log(receivedErrorMessage);
    fs.appendFileSync('error.log.txt', new Date() + ' ' + receivedErrorMessage.message + '\r\n');
}
exports.default = {
    errorProcessing,
    errorHandling,
};
