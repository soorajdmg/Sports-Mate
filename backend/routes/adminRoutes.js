const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getCities,
  getAreas,
  deleteUser
} = require('../controllers/adminController');
const { adminOnly } = require('../middleware/auth');

// Public routes
router.post('/login', adminLogin);

// Protected admin routes
router.get('/stats', adminOnly, getDashboardStats);
router.get('/users', adminOnly, getAllUsers);
router.get('/cities', adminOnly, getCities);
router.get('/areas', adminOnly, getAreas);
router.delete('/users/:id', adminOnly, deleteUser);

module.exports = router;
