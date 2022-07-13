const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1102q.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ignoreUndefined: true,
      }
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log('Failed to connect MongoDB', error.message);
    process.exit(1);
  }
};

module.exports = connectMongoDB;
