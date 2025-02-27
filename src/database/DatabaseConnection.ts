require('dotenv').config();
import { Sequelize } from 'sequelize';

// Database credentials
const DB_NAME = process.env.DATABASE_NAME || '';
const DB_USER = process.env.DATABASE_URI || '';
const DB_PASS = process.env.DATABASE_URI || '';
const DB_HOST = 'localhost'; 

// Initialize Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: true, // Set to true for logging SQL queries
});

// Test the database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (error) 
  {
    console.error('Unable to connect to the database:', error);
  }
};

connectDB();

export default sequelize;
