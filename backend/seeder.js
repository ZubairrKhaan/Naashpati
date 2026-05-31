import dotenv from "dotenv";
import connectDB from "./config/database.js";
import User from "./models/User.js";

dotenv.config();

const adminUser = {
  name: process.env.ADMIN_NAME || "Admin",
  email: process.env.ADMIN_EMAIL || "admin@naashpati.com",
  password: process.env.ADMIN_PASSWORD || "admin123",
  role: process.env.ADMIN_ROLE || "admin",
};

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: adminUser.email }).select(
      "+password",
    );

    if (existingAdmin) {
      existingAdmin.name = adminUser.name;
      existingAdmin.role = adminUser.role;
      existingAdmin.password = adminUser.password;
      await existingAdmin.save();
      console.log(`Admin user updated: ${existingAdmin.email}`);
    } else {
      const user = await User.create(adminUser);
      console.log(`Admin user created: ${user.email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
};

seedAdmin();
