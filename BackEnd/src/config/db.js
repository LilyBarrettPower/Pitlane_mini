// Connection to database 

const mongoose = require('mongoose'); // Load Mongoose library to the file 

async function connectDB(mongoUri) { // Define function with mongoUri as the input 
    try {
        await mongoose.connect(mongoUri, { // connect to this MongoDB database 
            // Add any mongoose options here 
        });
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("MongoDB NOT Connected:", err.message); // If any errors occur, display them
        process.exit(1); // Quit the app if there is an error 
    }
}

module.exports = connectDB // Make the function available in other files 