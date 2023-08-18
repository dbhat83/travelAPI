const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review Cannot be empty'],
    },
    rating: {
      type: Number,
      required: [true, 'Review Cannot be empty'],
      max: [5, 'Rating can"t be more than 5'],
      min: [1, 'Rating can"t be less than 1'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const Review = mongoose.model('review', reviewSchema);
module.exports = Review;
