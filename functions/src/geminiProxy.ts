import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import axios from 'axios';

/**
 * Cloud Function to proxy Gemini API calls to avoid CORS issues
 * This function runs server-side and forwards requests to the Gemini API
 */
export const generateWithGemini = onCall({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  try {
    const { model, prompt, temperature = 0.7, maxTokens = 500, apiKey } = request.data;

    if (!model || !prompt || !apiKey) {
      throw new HttpsError('invalid-argument', 'Missing required parameters: model, prompt, and apiKey');
    }

    logger.info(`Generating content with model: ${model}`);

    // Try different API versions in case one fails
    const apiVersions = ['v1beta', 'v1'];
    let lastError: any = null;
    
    for (const apiVersion of apiVersions) {
      try {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens || 1000,  // Increase default to handle JSON response
            candidateCount: 1
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000  // 30 second timeout
        });

        const data = response.data;
        
        // Extract the generated text - check multiple possible locations
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Sometimes the text might be in a different structure
        if (!content && data.candidates?.[0]?.output) {
          content = data.candidates?.[0]?.output;
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
        } else if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
          // Content was cut off due to token limit
          logger.warn('Response truncated due to MAX_TOKENS', data);
          lastError = new Error('Response was truncated - increase maxTokens');
        } else {
          logger.warn('No content in response', JSON.stringify(data));
          lastError = new Error('No content returned from Gemini API');
        }
      } catch (error: any) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          logger.error(`API error (${apiVersion}):`, error.response.data);
          lastError = new Error(`API error: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          // The request was made but no response was received
          logger.error(`No response (${apiVersion}):`, error.message);
          lastError = new Error(`No response from API: ${error.message}`);
        } else {
          // Something happened in setting up the request that triggered an Error
          logger.error(`Request setup error (${apiVersion}):`, error.message);
          lastError = error;
        }
      }
    }

    // If we get here, all attempts failed
    throw new HttpsError('internal', `Failed to generate content: ${lastError?.message || 'Unknown error'}`);
    
  } catch (error) {
    logger.error('Error in generateWithGemini:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to process request');
  }
});
