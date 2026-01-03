import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connect from "./src/db/index.js";

dotenv.config();

const app = express();

// connect to database
connect();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend server is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
