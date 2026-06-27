import mongoose from "mongoose"
const connectDB = async () => {
    try {
        console.log(process.env.MONGODB_URI);
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
        );

        console.log(
            `MongoDB Connected: ${connectionInstance.connection.host}`
        );

    } catch (error) {
        console.log("MongoDB Error:", error);
        process.exit(1);
    }
};

export default connectDB;