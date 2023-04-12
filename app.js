// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize express app
const app = express();

// Set up middleware
app.use(express.json());

// Set up MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define user schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: Array, required: true },
  verified: { type: Boolean, required: true },
});

//userSchema.index({ name: "text", location: "text" });

// Create user model
const User = mongoose.model('User', userSchema);

// Define route to search for users
app.get('/users', async (req, res) => {
  try {

    const data = await User.find();
    console.log("Number Of Documents : " + data.length);
    if (data == 0) {
      // Add some sample data to the database
      const sampleData = [
        { name: 'John Doe', location: 'New York', verified: true },
        { name: 'Jane Smith', location: 'Los Angeles', verified: false },
        { name: 'Bob Johnson', location: 'San Francisco', verified: true },
        { name: 'Alice Lee', location: 'Chicago', verified: false },
        { name: 'David Chen', location: 'Houston', verified: true },
      ];
      User.insertMany(sampleData)
        .then(() => console.log('Sample data added to database'))
        .catch((err) => console.error(err));

    }

    const searchString = req.query.search ? req.query.search : '';
    const locations = req.query.location ? req.query.location.split(',') : [];
    const verified = req.query.verified === 'true';

    const users = await User.find({
      $and: [
        { $text: { $search: searchString } },
        { location: { $all: locations } },
        { verified: verified },
      ],
    })
      .sort({ name: 1 })
      .exec();

    const count = users.length;
    console.log("Query Result Doucmnent Count : "+count)
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/updated', async (req, res) => {
  try {
    // Check if query parameters are present and set default values if not
    const searchString = req.query.search || '';
    const locations = req.query.location ? req.query.location.split(',') : [];
    const verified = req.query.verified === 'true';

    // Build the search query object
    const query = {};
    if (searchString) {
      query.$text = { $search: searchString };
    }
    if (locations.length > 0) {
      query.location = { $all: locations };
    }
    if (typeof verified === 'boolean') {
      query.verified = verified;
    }

    console.log(query);
    // Find the matching users and send the response
    const users = await User.find(query).sort({ name: 1 }).exec();
    const count = users.length;
    console.log("Query Result Doucmnent Count : "+count)
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});


/*
Testing api- 3 parameter are required for this api
http://localhost:3000/users?search=John&location=New%20York&verified=true
http://localhost:3000/users?search=Jane%20Smith&location=Los%20Angeles&verified=false
http://localhost:3000/users?search=David&location=Houston&verified=true

http://localhost:3000/users?search=David&location=India&verified=true
http://localhost:3000/users?search=John&location=UK&verified=false

upadted query: any number of parameter <=3
http://localhost:3000/updated?search=&verified=true
http://localhost:3000/updated
http://localhost:3000/updated?location=India&verified=true

*/