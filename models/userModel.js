const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { stringify } = require('querystring');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user Must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user Must have an email'],
    unique: true,
    lowercase: true,
  },
  photo: String,
  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'guide', 'user'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must contain 10 or more characters'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Pl confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords must be same ',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Compares the given password with the encrypted password to allow usr to login
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // console.log(candidatePassword, userPassword);
  return await bcrypt.compare(candidatePassword, userPassword);
};

//checks if the user has ever changed password and if so if that is before 0r after the JWT token
userSchema.methods.userChangedPassword = function (jwtTimeStamp) {
  //False  means user has nor changed the password
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimeStamp > jwtTimeStamp;
  }

  return false;
};

// Creates a password reset token(hashed and saved in db), a reset token(to be send to user without hashing) and reset token expiry
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpiry = Date.now() + 10 * 60 * 1000;
  // console.log(resetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
