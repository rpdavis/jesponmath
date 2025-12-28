/**
 * Clear all debug logs from Firestore
 * Run with: node scripts/clearDebugLogs.cjs
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin using application default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'jepsonmath',
  })
}

const db = admin.firestore()

async function clearAllDebugLogs() {
  console.log('🗑️  Starting to delete all debug logs...')

  try {
    const snapshot = await db.collection('fluencyDebugLogs').get()
    console.log(`Found ${snapshot.size} logs to delete`)

    if (snapshot.size === 0) {
      console.log('✅ No logs to delete')
      process.exit(0)
    }

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500
    let deletedCount = 0

    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = db.batch()
      const batchDocs = snapshot.docs.slice(i, i + batchSize)

      batchDocs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()
      deletedCount += batchDocs.length
      console.log(`Deleted ${deletedCount} / ${snapshot.size} logs...`)
    }

    console.log('✅ All debug logs deleted!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

clearAllDebugLogs()



