const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const router = express.Router();

// router.param('id', tourController.checkID);
router
  .route('/top-5-tours')
  .get(tourController.aliasTour, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getStats);
router.route('/tour-plans/:year').get(tourController.getMonthlyPlans);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictDelete('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
