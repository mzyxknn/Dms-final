// admin.js

const admin = require('firebase-admin');
const serviceAccount = require("C:/Users/MC BEN/Documents/GitHub/DMS-PROJECT/src/serverless/lgudms-firebase-adminsdk-y0ge8-e67096178e.json"); // Replace with your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function deleteUser(uid) {
  try {
    await admin.auth().deleteUser(uid);
    console.log(`Successfully deleted user with UID: ${uid}`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

module.exports = { admin, deleteUser };
