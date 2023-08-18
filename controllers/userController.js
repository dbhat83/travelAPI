const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
// ----------- API ROUTE HANDLERS ----------- //

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //(1) Generate error if user tries to update password with this route
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('This route is not for password updates', 400));
  }
  // console.log(req.user);
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  //(2) Update user document
  res.status(200).json({
    status: 'updated',
    updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });
  console.log(user);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'not found',
    message: 'Route not created yet! ',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'not found',
    message: 'Route not created yet! ',
  });
};

exports.updateUser = (req, res, next) => {
  res.status(500).json({
    status: 'not found',
    message: 'Route not created yet! ',
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'not found',
    message: 'Route not created yet! ',
  });
};
