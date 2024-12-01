import mongoose, { connect } from "mongoose";
require('dotenv').config();

const connectToDatabase = async () => {

  const mongoURI = process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.0.2';

  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to the MongoDB database');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

export default connectToDatabase;