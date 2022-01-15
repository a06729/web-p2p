const admin = require("firebase-admin");
require('dotenv').config();

// const serviceAccount = require("./serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const config = {
//   "projectId": process.env.FIREBASE_PROJECT_ID,
//   "privateKey": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//   "clientEmail": process.env.FIREBASE_CLIENT_EMAIL,
// }
admin.initializeApp({
  credential:admin.credential.cert({
    "projectId": process.env.FIREBASE_PROJECT_ID,
    "privateKey": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    "clientEmail": process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL:"https://p2pFbase.firebaseio.com"
});
const dbService=admin.firestore();
export default dbService;