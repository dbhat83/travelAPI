// const fs = require('fs');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const apiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

// ------ READING FROM JSON FILE ---------- //
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// --------- PARAMS MIDDLEWARE ---------- //

// exports.checkID = (req, res, next, val) => {
//   if (val > tours.length) {
//     return res.status(404).json({
//       status: 'Fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   const body = req.body;
//   //   console.log(body);
//   if (!body.name || !body.price) {
//     return res.status(400).json({ status: 'fail', message: 'Invalid data' });
//   }
//   next();
// };

exports.aliasTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,ratingsAverage,price,duration';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // try {
  // console.log(req.query);
  // ------ BUILD QUERY ---------//

  // // ---- (1) FILTERING -------//
  // const queryObj = { ...req.query };
  // const exculdedFields = ['page', 'sort', 'limit', 'fields'];
  // exculdedFields.forEach((el) => delete queryObj[el]);

  // //----- (1.1) ADVANCE FILTERING -------- //

  // let queryString = JSON.stringify(queryObj);
  // // console.log(queryString);

  // queryString = queryString.replace(
  //   /\b(gte|gt|lte|lt)\b/g,
  //   (match) => `$${match}`
  // );

  // // console.log(JSON.parse(queryString));
  // let query = Tour.find(JSON.parse(queryString));

  // ------- (2) SORTING -----------//
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query.sort(sortBy);
  // } else {
  //   query = query.sort('-date');
  // }

  // // ------ (3) LIMIT FIELDS ------//
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  // } else {
  //   //to exclude certain fields from displaying
  //   query = query.select('-__v');
  // }

  // // ---- (4) PAGINATION ------- //
  // const page = req.query.page * 1;
  // const limit = req.query.limit * 1;
  // const skip = (page - 1) * limit;

  // query = query.skip(skip).limit(limit);
  // // console.log(query);
  // if (req.query.page) {
  //   const tourCount = await Tour.countDocuments();
  //   if (skip >= tourCount) {
  //     throw new Error('This page does not exist');
  //   }
  // }
  //------- EXECUTE QUERY---------//
  const features = new apiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const tours = await features.query;
  // console.log(tours);
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // const id = req.params.id * 1;

  const tour = await Tour.findById(req.params.id);
  // const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('No Tour with this ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });

  // const tour = tours.find((ele) => ele.id === id);

  // res.status(200).json({
  //   status: 'success',
  // data: {
  //   tour,
  // },
  // });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // const newId = tours[tours.length - 1].id + 1;
  // const newTour = Object.assign({ id: newId }, req.body);
  // tours.push(newTour);
  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   (err) => {
  //     res.status(201).json({
  //       status: 'success',
  //       data: {
  //         tour: newTour,
  //       },
  //     });
  //   }
  // );
  const newTour = await Tour.create(req.body);
  res.status(200).json({
    status: 'success',
    tour: newTour,
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour: 'Updated data',
  //   },
  // });

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No Tour with this ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // res.status(204).json({
  //   status: 'success',
  //   data: null,
  // });

  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No Tour with this ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null,
        _id: '$difficulty',
        countTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        ratingsCount: { $sum: '$ratingsQuantity' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPRice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'easy' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlans = catchAsync(async (req, res, next) => {
  let year = req.params.year;
  let plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        toursCount: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { toursCount: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
