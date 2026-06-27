import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

const verifyJWT = async (req, res, next) => {

    try {

        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized Request"
            });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
        //ye verify mei wahi return kiya hai jo hmlog banate wakt isko diye the 

        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            return res.status(401).json({
                message: "Invalid Access Token"
            });
        }

        req.user = user;
        //with this we are adding the property "user" to our req object.


        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid Access Token"
        });

    }

};

export { verifyJWT };