import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

const connectionDB = async () => {
    try {

        // const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true
        // });

        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
            family: 4, // Force using IPv4
            // useNewUrlParser: true, // As long as needed
            // useUnifiedTopology: true // As long as needed
        });
        console.log(`\n MONGODB connected || DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(`MongoDB Connection ERROR :`, error);
        process.exit(1);
    }
}

export default connectionDB