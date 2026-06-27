import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config();

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `Server Running On Port ${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed", error);
  });