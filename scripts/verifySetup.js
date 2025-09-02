#!/usr/bin/env node
// Setup Verification Script for Math Games MRD
const https = require('https');

const PROJECT_ID = 'mathgamesmrd';
const PROJECT_NUMBER = '712458807273';
const API_KEY = 'AIzaSyDcPqNOgLkPeB60t_Y0k_zkseX2Gnp2n7c';

console.log('🔍 Verifying Math Games MRD Setup...\n');

// Check if APIs are enabled
const requiredAPIs = [
  'classroom.googleapis.com',
  'people.googleapis.com',
  'cloudfunctions.googleapis.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com'
];

async function checkAPI(apiName) {
  return new Promise((resolve) => {
    const url = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/${apiName}?key=${API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const enabled = result.state === 'ENABLED';
          console.log(`${enabled ? '✅' : '❌'} ${apiName}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
          resolve(enabled);
        } catch (error) {
          console.log(`❓ ${apiName}: Could not verify (${res.statusCode})`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${apiName}: Error checking - ${err.message}`);
      resolve(false);
    });
  });
}

async function verifySetup() {
  console.log('📊 Project Information:');
  console.log(`   Project ID: ${PROJECT_ID}`);
  console.log(`   Project Number: ${PROJECT_NUMBER}`);
  console.log(`   API Key: ${API_KEY.substring(0, 20)}...`);
  console.log('');

  console.log('🔌 Checking Required APIs:');
  
  const apiChecks = await Promise.all(
    requiredAPIs.map(api => checkAPI(api))
  );
  
  const enabledCount = apiChecks.filter(Boolean).length;
  console.log(`\n📈 APIs Status: ${enabledCount}/${requiredAPIs.length} enabled`);
  
  if (enabledCount === requiredAPIs.length) {
    console.log('✅ All required APIs are enabled!');
  } else {
    console.log('⚠️  Some APIs need to be enabled. Check the setup guide.');
  }

  console.log('\n🌐 Application URLs:');
  console.log(`   Production: https://mathgamesmrd.web.app`);
  console.log(`   Firebase Console: https://console.firebase.google.com/project/mathgamesmrd`);
  console.log(`   Google Cloud Console: https://console.cloud.google.com/home/dashboard?project=mathgamesmrd`);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Enable any missing APIs shown above');
  console.log('2. Configure OAuth consent screen');
  console.log('3. Create OAuth2 credentials');
  console.log('4. Update Firebase config with OAuth2 Client ID');
  console.log('5. Test authentication flow');
  
  console.log('\n📖 See docs/GOOGLE_API_SETUP.md for detailed instructions');
}

verifySetup().catch(console.error);
