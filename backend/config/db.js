// import mongoose to connect to MongoDB
const mongoose = require("mongoose");

// function to connect to MongoDB using mongoose
const connectDB = async () => {
    // try to connect to MongoDB using the connection string(from .env)
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    }
    // if try fails, catch the error, and print in error console, and exit the process
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

// export the connectDB function to be used in other parts
module.exports = connectDB;