const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.MONGO_URI;

exports.connectToDB = (dbName, server) => {
  mongoose.set('strictQuery', false);
  mongoose
    .connect(URI)
    .then(() => {
      console.log(`Connected to ${dbName} DB successfully`);
    })
    .then(() => {
      server();
    })
    .catch((err) => {
      console.log(err);
    });
};

