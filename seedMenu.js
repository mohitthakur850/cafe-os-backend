const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = "mongodb+srv://mohit85039_db_user:PrnWTmUlUWGEVoWE@cluster0.8bvhtvy.mongodb.net/?appName=Cluster0";


mongoose.connect(MONGO_URI).then(() => console.log('✅ DB Connected for Admin Setup'));

const Admin = mongoose.model('Admin', new mongoose.Schema({ username: String, password: String }));

const setupAdmin = async () => {
  try {
    // Check if Admin already exists
    const existingAdmin = await Admin.findOne({ username: "Root" });

    if (!existingAdmin) {
      await Admin.create({ username: "Root", password: "Admin123" });
      console.log("✅ Admin 'Root' created successfully!");
    } else {
      console.log("ℹ️ Admin already exists. No changes made.");
    }

    console.log("🚀 Your existing categories and products are SAFE.");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

setupAdmin();