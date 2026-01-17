const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

    if (!adminExists) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL || 'admin@sportsteam.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        name: 'Super Admin',
        role: 'superadmin'
      });
      console.log('Admin account created successfully');
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

module.exports = seedAdmin;
