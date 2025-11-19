// Google Sheets API service
export interface GoogleSheet {
  spreadsheetId: string;
  title: string;
  url: string;
}

export class GoogleSheetsService {
  private accessToken: string | null = null;
  private baseUrl = 'https://sheets.googleapis.com/v4';

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  // Set access token for API calls
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  // Get user's access token using Firebase Auth Google provider with Sheets scopes
  async authenticate(): Promise<string> {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('../firebase/config');
      
      console.log('🔐 Authenticating with Google for Sheets access...');
      
      // Create provider with Sheets scope
      const sheetsProvider = new GoogleAuthProvider();
      sheetsProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
      
      // Force consent to ensure we get the sheets scope
      sheetsProvider.setCustomParameters({
        prompt: 'consent'
      });
      
      const result = await signInWithPopup(auth, sheetsProvider);
      console.log('✅ Google Sheets authentication successful');
      
      // Get the OAuth access token for Sheets API calls
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        console.log('✅ Sheets API access token received');
        this.accessToken = token;
        saveGoogleSheetsToken(token);
        return token;
      } else {
        console.error('❌ No access token in Google response');
        throw new Error('No access token received. Please ensure you grant permission to access Google Sheets.');
      }
      
    } catch (error: any) {
      console.error('❌ Google Sheets authentication failed:', error);
      
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Authentication was cancelled. Please try again and grant access to Google Sheets.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized. Please contact your administrator.');
      } else {
        throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Sheets API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Create a new spreadsheet
  async createSpreadsheet(title: string): Promise<GoogleSheet> {
    try {
      const response = await this.makeRequest('/spreadsheets', {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            title: title
          }
        })
      });

      return {
        spreadsheetId: response.spreadsheetId,
        title: response.properties.title,
        url: `https://docs.google.com/spreadsheets/d/${response.spreadsheetId}`
      };
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  // Update spreadsheet with CSV data (creates tab if it doesn't exist)
  async updateSpreadsheet(spreadsheetId: string, sheetName: string, csvData: string[][]): Promise<void> {
    try {
      // First, check if the sheet/tab exists, create it if it doesn't
      const spreadsheet = await this.getSpreadsheet(spreadsheetId);
      const existingSheet = spreadsheet.sheets?.find((s: any) => s.properties.title === sheetName);
      
      if (!existingSheet) {
        // Sheet doesn't exist, create it
        await this.addSheet(spreadsheetId, sheetName);
      }
      
      // Clear the existing sheet data
      const range = `${sheetName}!A1:ZZ1000`; // Large range to clear old data
      try {
        await this.makeRequest(`/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
          method: 'PUT',
          body: JSON.stringify({
            values: []
          })
        });
      } catch (clearError) {
        // Ignore errors when clearing (sheet might be empty)
        console.log('Note: Could not clear sheet (may be empty)');
      }

      // Write new data
      const updateRange = `${sheetName}!A1`;
      await this.makeRequest(`/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({
          values: csvData
        })
      });

      console.log(`✅ Successfully updated tab "${sheetName}" in spreadsheet ${spreadsheetId}`);
    } catch (error: any) {
      console.error('Error updating spreadsheet:', error);
      throw error;
    }
  }

  // Add a new sheet to the spreadsheet
  async addSheet(spreadsheetId: string, sheetName: string): Promise<void> {
    try {
      await this.makeRequest(`/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        })
      });
    } catch (error) {
      console.error('Error adding sheet:', error);
      throw error;
    }
  }

  // Get spreadsheet info
  async getSpreadsheet(spreadsheetId: string): Promise<any> {
    try {
      return await this.makeRequest(`/spreadsheets/${spreadsheetId}`);
    } catch (error) {
      console.error('Error getting spreadsheet:', error);
      throw error;
    }
  }
}

// Save token to localStorage
export const saveGoogleSheetsToken = (token: string): void => {
  localStorage.setItem('google_sheets_token', token);
  localStorage.setItem('google_sheets_token_time', Date.now().toString());
};

// Get token from localStorage
export const getGoogleSheetsToken = (): string | null => {
  const token = localStorage.getItem('google_sheets_token');
  const tokenTime = localStorage.getItem('google_sheets_token_time');
  
  // Check if token is expired (Google tokens typically last 1 hour)
  if (token && tokenTime) {
    const elapsed = Date.now() - parseInt(tokenTime);
    const oneHour = 60 * 60 * 1000;
    
    if (elapsed > oneHour) {
      // Token expired, clear it
      localStorage.removeItem('google_sheets_token');
      localStorage.removeItem('google_sheets_token_time');
      return null;
    }
    
    return token;
  }
  
  return null;
};

// Clear stored token
export const clearGoogleSheetsToken = (): void => {
  localStorage.removeItem('google_sheets_token');
  localStorage.removeItem('google_sheets_token_time');
};

// Check if user is authenticated
export const isGoogleSheetsAuthenticated = (): boolean => {
  return getGoogleSheetsToken() !== null;
};

// Create singleton instance
export const googleSheetsService = new GoogleSheetsService(getGoogleSheetsToken() || undefined);

