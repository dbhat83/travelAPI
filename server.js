const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED Exception! 💥 SHUTTING DOWN');
  process.exit(1);
});

const app = require('./app');

const mongoose = require('mongoose');

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to database');
  });

// --------- CREATE A SCHEMA & MODEL USING MONGOOSE ------- //
// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'A tour must have a name'],
//     unique: true,
//   },
//   price: {
//     type: Number,
//     required: [true, 'A tour must have a price'],
//   },
//   rating: {
//     type: Number,
//     default: 4.5,
//   },
// });

// const Tour = mongoose.model('Tour', tourSchema);

// const testTour = new Tour({
//   name: 'Tour 4',
//   price: 200,
// });

// testTour
//   .save()
//   .then((con) => console.log(con))
//   .catch((err) => console.log(err));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`App started at ${process.env.PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 SHUTTING DOWN');
  server.close(() => {
    process.exit(1);
  });
});
