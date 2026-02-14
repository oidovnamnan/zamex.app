import * as admin from 'firebase-admin';
import path from 'path';

const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccountPath = path.join(process.cwd(), 'firebase-key.json');

try {
    if (!admin.apps.length) {
        if (serviceAccountVar) {
            // Parse JSON from environment variable
            const serviceAccount = JSON.parse(serviceAccountVar);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin initialized from Environment Variable');
        } else {
            // Fallback to local file
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountPath),
            });
            console.log('✅ Firebase Admin initialized from Local File');
        }
    }
} catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
}

export { admin };
