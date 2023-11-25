import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config({
    path: "./env"
})

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// this line is to allow the json data with limit
app.use(express.json({ limit: "16kb" }));

// this is using to encode the Url
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// this code is use to read of write the data from public (static folder within the project folder)
app.use(express.static("public"))

// this middleware will parse cookies and populate req.cookies
app.use(cookieParser())



// routes Import
import userRouter from "./routes/user.router.js"

// routes declaration
app.use("/api/v1/users", userRouter)

export { app }