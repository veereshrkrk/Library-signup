const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const readline = require('readline');
 
const app = express();
const port = 3006;
 
// MongoDB connection URI for local host
const MongoDBURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_management';
 
// Create a MongoClient instance outside of the routes
const client = new MongoClient(MongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true });
 
// Readline interface for better interaction during MongoDB connection
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
 
// Connect to MongoDB using Mongoose
mongoose.connect(MongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    startServer();
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the process if unable to connect to MongoDB
  });
 
// Function to start the server
function startServer() {
  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({ extended: true }));
 
  app.get('/', (req, res) => {
    res.redirect('/home');
  });
 
  app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/home.html');
  });
 
  app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });
 
  // Function to validate email address format
  function validateEmail(email) {
    const emailRegex = /@gmail\.com$/;
    return emailRegex.test(email);
  }
 
  // Function to validate phone number format
  function validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phoneNumber);
  }
 
  app.post('/signup', async (req, res) => {
    const { studentName, emailAddress, phoneNumber, studentRollNumber, fatherName, bookIssuedName } = req.body;
 
    // Validate email address
    if (!validateEmail(emailAddress)) {
      return res.status(400).send('Invalid email address format. Please try again.');
    }
 
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).send('Invalid phone number format. Please try again.');
    }
 
    // If validation passes, proceed with inserting data into MongoDB
    try {
      await client.connect();
      const database = client.db('library_management');
      const collection = database.collection('studentss');
      await collection.insertOne({ studentName, emailAddress, phoneNumber, studentRollNumber, fatherName, bookIssuedName });
    } catch (error) {
      console.error('Error inserting student data:', error);
      return res.status(500).send('Error inserting student data');
    } finally {
      await client.close();
      res.redirect('/success.html');
    }
  });

  // app.get('/login', (req, res) => {
  //   res.sendFile(__dirname + '/login.html');
  // });

 
  app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/home.html');
  });
 
  app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });
 
  app.get('/motivational', (req, res) => {
    res.sendFile(__dirname + '/motivational.html');
  });

 //**************************************************************** */
  // Add a new route for admin login
  app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
  });
  
  // Handle admin login
  app.post('/admin', (req, res) => {
    const { adminPassword } = req.body;
  
    // Replace 'your_admin_password' with the actual admin password stored in your Node.js file
    if (adminPassword === '123') {
        res.redirect('/registeredDetails.html'); // Redirect to registeredDetails.html after successful login
    } else {
        // res.status(401).send('Invalid admin password');
        res.redirect('/motivational');
    }
  });


  // Serve registeredDetails.html
app.get('/registeredDetails.html', (req, res) => {
  res.sendFile(__dirname + '/registeredDetails.html');
});


    // Serve registered user details
  app.get('/registeredDetails', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('library_management');
        const collection = database.collection('studentss');
        //display all student's data who has signup
        const allStudents = await collection.find({}).toArray(); 
        res.json(allStudents); // Send the registered user details as JSON response
    } catch (error) {
        console.error('Error retrieving registered details:', error);
        res.status(500).send('Error retrieving registered details');
    } finally {
        await client.close();
    }
  });
  
  // ******************************************
  

  app.post('/login', async (req, res) => {
    const { rollNumber } = req.body;
 
    try {
      await client.connect();
      const database = client.db('library_management');
      const collection = database.collection('studentss');
      const student = await collection.findOne({ studentRollNumber: rollNumber });
 
      if (!student) {
        return res.redirect('/motivational');
      }
 
      res.redirect(`/student/${rollNumber}`);
    } catch (error) {
      console.error('Error retrieving student data:', error);
      res.status(500).send('Error retrieving student data: ' + error.message);
    } finally {
      await client.close();
    }
  });
 
  app.get('/student/:rollNumber', async (req, res) => {
    const rollNumber = req.params.rollNumber;
 
    try {
      await client.connect();
      const database = client.db('library_management');
      const collection = database.collection('studentss');
      const student = await collection.findOne({ studentRollNumber: rollNumber });
 
      if (!student) {
        return res.status(404).send('Student not found.');
      }
 
      const htmlData = `
        <html>
        <head>
        <title>Student Details</title>
        </head>
        <style>
        body {
            font-family: Arial, sans-serif;
        }
        table {
            width: 50%;
            border-collapse: collapse;
            margin: 20px auto;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        </style>
        <table id="student-details">
          <tr>
            <th>Attribute</th>
            <th>Data of student</th>
          </tr>
          <tr>
            <td>Student Name</td>
            <td>${student.studentName}</td>
          </tr>
          <tr>
            <td>Email Address</td>
            <td class="blurred">${student.emailAddress}</td>
          </tr>
          <tr>
            <td>Phone Number</td>
            <td class="blurred">${student.phoneNumber}</td>
          </tr>
          <tr>
            <td>Student Roll Number</td>
            <td>${student.studentRollNumber}</td>
          </tr>
          <tr>
            <td>Father's Name</td>
            <td>${student.fatherName}</td>
          </tr>
          <tr>
            <td>Book Issued Name</td>
            <td>${student.bookIssuedName}</td>
          </tr>
        </table>
        </html>
      `;
     
      res.send(htmlData);
    } catch (error) {
      console.error('Error retrieving student data:', error);
      res.status(500).send('Error retrieving student data: ' + error.message);
    } finally {
      await client.close();
    }
  });
 
  app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
  });
}
 
// Close the readline interface when the application is terminated
process.on('SIGINT', () => {
    rl.close();
    process.exit(0);
  });

  // PS C:\Users\veerames\Downloads\Mini Project\nodeJsProject>