const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
// Initialize Firebase Admin SDK
const serviceAccount = require("C:/Users/MC BEN/Documents/GitHub/DMS-PROJECT/src/serverless/lgudms-firebase-adminsdk-y0ge8-e67096178e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Endpoint for user deletion by UID
app.post("/deleteUser", async (req, res) => {
  const { uid } = req.body;

  try {
    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(uid);

    // Delete user data from Firestore
    await admin.firestore().collection("users").doc(uid).delete();

    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Error deleting user." });
  }
});

const PORT = process.env.PORT || 5137;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
