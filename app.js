import dotenv from 'dotenv'
dotenv.config();

import express from "express";

// Importing 'cors' module for resolving Frontend & Backend Connection Problems
import cors from "cors";

import userRoutes from "./routes/userRoutes.js"

const app = express();

const port = process.env.PORT || "8000";

// Database Connection
import connectDB from './config/connectdb.js'
const DATABASE_URL = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/VermaStore"
connectDB(DATABASE_URL);

// Using CORS Policy
app.use(cors());

app.use(express.json());

// Creating Routes
app.use("/api/user", userRoutes);

// Listening App
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/api/user`);
});