// require("dotenv").config({ path: "./env" })

import dotenv from "dotenv";
import connectionDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path: "./env"
});

connectionDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is Running at PORT : ${process.env.PORT}`)
    })
}).catch((err) => {
    console.log(`MongoFb Connection failed !! `, err);
})

/*
const app = express()


    (async () => {

        try {

            await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
            app.on("error", () => {
                console.log("Error :", error);
                throw error
            });

            app.listen(process.env.PORT, () => {
                console.log(`App is running on PORT :${process.env.PORT}`)
            })
        } catch (error) {
            console.log("Error :", error);
            throw error
        }
    })()

    */

