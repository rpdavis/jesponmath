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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithGemini = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const axios_1 = __importDefault(require("axios"));
/**
 * Cloud Function to proxy Gemini API calls to avoid CORS issues
 * This function runs server-side and forwards requests to the Gemini API
 */
exports.generateWithGemini = (0, https_1.onCall)({
    cors: true,
    maxInstances: 10,
}, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const { model, prompt, temperature = 0.7, maxTokens = 500, apiKey } = request.data;
        if (!model || !prompt || !apiKey) {
            throw new https_1.HttpsError('invalid-argument', 'Missing required parameters: model, prompt, and apiKey');
        }
        logger.info(`Generating content with model: ${model}`);
        // Try different API versions in case one fails
        const apiVersions = ['v1beta', 'v1'];
        let lastError = null;
        for (const apiVersion of apiVersions) {
            try {
                const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
                const response = await axios_1.default.post(url, {
                    contents: [{
                            parts: [{
                                    text: prompt
                                }]
                        }],
                    generationConfig: {
                        temperature,
                        maxOutputTokens: maxTokens || 1000,
                        candidateCount: 1
                    }
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                });
                const data = response.data;
                // Extract the generated text - check multiple possible locations
                let content = (_e = (_d = (_c = (_b = (_a = data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
                // Sometimes the text might be in a different structure
                if (!content && ((_g = (_f = data.candidates) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.output)) {
                    content = (_j = (_h = data.candidates) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.output;
                }
                // Check if we have a valid response
                if (content) {
                    logger.info('Successfully generated content');
                    return {
                        success: true,
                        content,
                        model,
                        apiVersion
                    };
                }
                else if (((_l = (_k = data.candidates) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.finishReason) === 'MAX_TOKENS') {
                    // Content was cut off due to token limit
                    logger.warn('Response truncated due to MAX_TOKENS', data);
                    lastError = new Error('Response was truncated - increase maxTokens');
                }
                else {
                    logger.warn('No content in response', JSON.stringify(data));
                    lastError = new Error('No content returned from Gemini API');
                }
            }
            catch (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    logger.error(`API error (${apiVersion}):`, error.response.data);
                    lastError = new Error(`API error: ${JSON.stringify(error.response.data)}`);
                }
                else if (error.request) {
                    // The request was made but no response was received
                    logger.error(`No response (${apiVersion}):`, error.message);
                    lastError = new Error(`No response from API: ${error.message}`);
                }
                else {
                    // Something happened in setting up the request that triggered an Error
                    logger.error(`Request setup error (${apiVersion}):`, error.message);
                    lastError = error;
                }
            }
        }
        // If we get here, all attempts failed
        throw new https_1.HttpsError('internal', `Failed to generate content: ${(lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error'}`);
    }
    catch (error) {
        logger.error('Error in generateWithGemini:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to process request');
    }
});
//# sourceMappingURL=geminiProxy.js.map