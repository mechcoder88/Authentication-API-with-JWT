import jwt from "jsonwebtoken";

import userModel from "../models/user.js";

var checkUserAuth = async (req, res, next) => {
    let token;
    const { authorization } = req.headers;
    // * Checking if "authorization" is present or not as well as if it is present, whether it starts with "bearer" or not ?
    if (authorization && authorization.startsWith("Bearer")) {
        try {
            // TODO : Getting "token" from header
            // * Splitting & Converting the 'authorization' header string into an Array of strings by splitting at " " Character
            const tokenArray = authorization.split(" ");
            token = tokenArray[1];

            // TODO : Verifying Token
            // * Getting "UserId" from "token"
            const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY);

            // * Getting "User" with the "UserId" from the DataBase
            // req.user = await userModel.findById(userId); // It'll get all Details of the User
            // OR
            req.user = await userModel.findById(userID).select("-password"); // It'll get all Details of the User except the Password

            next();
        } catch (error) {
            console.log(`Error : `, error);
            res.status(401).send({ "status": "failed", "message": `Unauthorized User !!` });
        }
    } else {
        res.status(401).send({ "status": "failed", "message": `Unauthorized User !!, No Token !!` });
    }
}

export default checkUserAuth