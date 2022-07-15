const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectMongoDB = require('./database/mongoDB');
const route = require('./routes');

// Environment config
dotenv.config();

// Connect to MongoDB
connectMongoDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json'
  );
  next();
});

// Init routes
route(app);

app.get('/', (req, res) => {
  res.send('Hello');
});

app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});
