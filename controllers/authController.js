const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//CREATE AND SEND JWT TOKEN WITH COOKIE
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// SIGNUP
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role,
  });
  createSendToken(newUser, 201, res);
  //   const token = signToken(newUser._id);

  //   res.status(201).json({
  //     status: 'success',
  //     token,
  //     data: {
  //       user: newUser,
  //     },
  //   });
});

//LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if user entered email and password
  if (!email || !password) {
    return next(new AppError('Enter email and Password', 400));
  }

  //2) Check if the email and password is valid
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email or password incorrect', 401));
  }

  //3) after success, Generate a token,
  createSendToken(user, 200, res);

  //   const token = signToken(user._id);

  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

/// PROTECTING route to acess only when logged in
exports.protect = catchAsync(async (req, res, next) => {
  //(1) Getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access.', 401)
    );
  }
  //(2)  Verifying the token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //(3) Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'Current user doesn"t exist. Please login again to get access.',
        401
      )
    );
  }
  //(4) Check if the user changed password after token was generated
  if (currentUser.userChangedPassword(decoded.iat)) {
    return next(
      new AppError(
        'Password Changed After token is generated. Please login again to get access.',
        401
      )
    );
  }

  req.user = currentUser;
  next();
});

/// Restricting user roles to delete any tour
exports.restrictDelete = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are restricted to perform this action', 403)
      );
    }
    next();
  };
};

//FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //(1) GET user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email', 403));
  }
  //(2) Genearte a random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //(3) Send it to user email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password, submit a new patch request with your new password and confirm password to ${resetURL}. \n If you didn't forgot your password please ignore this email `;
  try {
    await sendEmail({
      email: user.email,
      subject: `Your Password Reset Token(valid for 10min only)`,
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token send to email ',
    });
  } catch (err) {
    user.passwordResetExpiry = undefined;
    user.createPasswordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending email. Try again later', 500));
  }
});

//RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  //(1) GET the user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //(2) Check for token expiry and user exists if so set the new password

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Invalid or Expired Token', 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpiry = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  //(3) Update the passwordchangedat
  //to be done in the usermodel using document middleware
  //(4) login the user , send JWT

  createSendToken(user, 200, res);
  //   const token = signToken(user._id);

  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // (1) Get the user from collection
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('Invalid User', 401));
  }

  //(2) Check if the password inputed is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Incorrect Current Password', 401));
  }
  //(3) update the passwod

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  //(4) Login the user, send a new JWT
  createSendToken(user, 200, res);
  //   const token = signToken(user._id);
  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});
