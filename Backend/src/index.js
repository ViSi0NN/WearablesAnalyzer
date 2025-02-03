import dotenv from "dotenv";
import {connectDB} from "./db/connectDB.js";
import app from "./app.js";

dotenv.config({
  path: `./.env`,
});

connectDB()
    .then((response)=>{
        console.log("MongoDB Connected Successfully");
        app.on("error",(error)=>{
            console.log("ERROR: ", error);
            throw error
        });
        app.listen(process.env.PORT || 3000 , ()=>{
            console.log(`App listening on ${process.env.PORT}`);
        })
    })
    .catch((error)=>{
        console.log("MONGODB CONNECTION FAILED: ", error);

    })