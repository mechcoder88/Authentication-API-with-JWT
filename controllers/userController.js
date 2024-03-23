import userModel from "../models/user.js";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import transporter from "../config/emailConfig.js";

class UserController {
    // TODO : User Registration
    static userRegistration = async (req, res) => {
        const { name, email, password, password_confirmation, tc } = req.body;

        // Checking if a user is already registered with the same "email" to avoid Spam Attacks
        const userCheck = await userModel.findOne({ email: email });
        if (userCheck) {
            res.send({ "status": "failed", "message": `Already registered with '${email}' email address` });
        }
        else {
            // * Checking for Any Blank Field
            if (name && email && password && password_confirmation && tc) {
                // * Checking for Password MisMatch
                if (password === password_confirmation) {
                    try {
                        // * Securing the Password
                        const salt = await bcrypt.genSalt(10);
                        const hashPassword = await bcrypt.hash(password, salt);
                        // * Registering/Saving the User
                        const newUser = new userModel({
                            name: name,
                            email: email,
                            password: hashPassword,
                            tc: tc
                        });
                        await newUser.save();

                        // * Finding the Id of the New Registered User from the Database (Using the email received in the 'req' object)
                        const savedUser = await userModel.findOne({ email: email });

                        // * Generating JWT Token for the New Registered User using its user id
                        const token = jwt.sign({ userID: savedUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '4d' });

                        res.status(201).send({ "status": "success", "message": `Registration Successful !!`, "token": token });
                    } catch (error) {
                        console.log(`Error : `, error);
                        res.send({ "status": "failed", "message": `Unable To register !!` });
                    }

                } else {
                    res.send({ "status": "failed", "message": `Passwords & Confirm Password doesn't Match !!` });
                }
            }
            else {
                res.send({ "status": "failed", "message": `All Fields are Required !!` });
            }
        }
    }

    // TODO : User Login
    static userLogin = async (req, res) => {
        try {
            const { email, password } = req.body;

            // * Checking for Any Blank Field
            if (email && password) {
                // * Checking if a user already exist with the given email
                const user = await userModel.findOne({ email: email });
                if (user !== null) {
                    // * Comparing Passwords
                    const isMatch = await bcrypt.compare(password, user.password);
                    // * Matching email & password
                    if ((user.email === email) && isMatch) {
                        // * Generating JWT Token for Logged In User using its user id
                        const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '4d' });

                        res.send({ "status": "success", "message": `LoggedIn Successfully !!`, "token": token });
                    } else {
                        res.send({ "status": "failed", "message": `The email or password is Invalid !!` });
                    }
                } else {
                    res.send({ "status": "failed", "message": `No user exists with '${email}' email address` });
                }
            } else {
                res.send({ "status": "failed", "message": `All Fields are Required !!` });
            }
        } catch (error) {
            console.log(`Error : `, error);
        }
    }

    // TODO : Change Password
    // ! Note : Changing Password would be only possible for a User if the Old Password is Known.
    static changeUserPassword = async (req, res) => {
        // Since it is a After Login Process so the User would have been already validated, so there's no need to validate the User again.
        const { password, password_confirmation } = req.body;

        // * Checking for Any Blank Field
        if (password && password_confirmation) {
            // * Checking for Password MisMatch
            if (password !== password_confirmation) {
                res.send({ "status": "failed", "message": `Passwords & Confirm Password doesn't Match !!` });
            } else {
                // * Creating New Hash Password
                const salt = await bcrypt.genSalt(10);
                const newHashPassword = await bcrypt.hash(password, salt);

                // * Changing Password
                await userModel.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } });

                // Sending Response for Successfully Changing Password
                res.send({ "status": "success", "message": `Password Changed Successfully !!` });
            }
        } else {
            res.send({ "status": "failed", "message": `All Fields are Required !!` });
        }
    }

    // TODO : Fetch Logged In User Details
    static loggedUser = async (req, res) => {
        res.send({ "user": req.user });
    }

    // TODO : Send User Password Reset Email
    static sendUserPasswordResetEmail = async (req, res) => {
        // In a Frontend form, the 'User' will submit an 'email address' to receive the 'password reset email' on it.
        // This email address will be available to the Backend in the 'req' object to send the password reset email.  

        const { email } = req.body;
        // * Checking for Any Blank Field
        if (email) {
            // * Checking if a user already exist with the given email
            const user = await userModel.findOne({ email: email });
            if (user) {
                // * Generating Token for Password Reset Email
                const secretString = user._id + process.env.JWT_SECRET_KEY;
                const token = jwt.sign({ userID: user._id }, secretString, { expiresIn: '15m' });
                // * Password Reset Link
                const link = `http://127.0.0.1/api/user/reset/${user._id}/${token}`;

                // * Sending Email
                let info = await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: "VermaStore -  Password Reset Link",
                    text: "Hello User, This is a Password Reset Email",
                    html: `<a href=${link}>Click Here</a> to Reset Your Password`
                });
                
                // * Sending Response for Password Reset Email Sent
                res.send({ "status": "success", "message": "Password Reset Email Sent Successfully !! Check Your Email !!", "info" : info });
            } else {
                res.send({ "status": "failed", "message": `No user exists with '${email}' email address` });
            }
        } else {
            res.send({ "status": "failed", "message": `E-mail is Required !!` });
        }
    }

    // TODO : User Password Reset
    // This function will be Executed when the User will click the Password Reset Link Received in the Submitted email address
    // In Frontend, two fields of Password & Confirm Password will be present & the User will submit the New Password through Them to the Backend.
    // These Two Field values will be available to the Backend in the 'req' Object.   
    static userPasswordReset = async (req, res) => {
        const { password, password_confirmation } = req.body;
        const { id, token } = req.params;

        // * Finding the user with the given 'id'
        const fetchedUser = await userModel.findById(id);
        // Generating New Secret String for Token Verification
        const newSecretString = fetchedUser._id + process.env.JWT_SECRET_KEY;
        try {
            // * Verifying Token
            // In Token Generation of 'Password Reset Email' Process, 'secretString' was made by adding 'user._id' & 'process.env.JWT_SECRET_KEY'
            // Here in Token Generation of 'User Password Reset' Precess, 'newSecretString' is made by adding 'fetchedUser._id' & 'process.env.JWT_SECRET_KEY'.
            // If Both 'users' are same then 'secretString' & 'newSecretString' will be same and the same token will be verified. 
            jwt.verify(token, newSecretString);

            // * Checking for Any Blank Field
            if (password && password_confirmation) {
                // * Checking for Password MisMatch
                if (password !== password_confirmation) {
                    res.send({ "status": "failed", "message": `Passwords & Confirm Password doesn't Match !!` });
                } else {
                    // * Creating New Hash Password
                    const salt = await bcrypt.genSalt(10);
                    const newHashPassword = await bcrypt.hash(password, salt);
                    
                    // * Changing Password
                    await userModel.findByIdAndUpdate(fetchedUser._id, { $set: { password: newHashPassword } });

                    // Sending Response for Successful Password Reset
                    res.send({ "status": "success", "message": `Password Reset Successful !!` });
                }
            } else {
                res.send({ "status": "failed", "message": `All Fields are Required !!` });
            }
        } catch (error) {
            console.log(`Error : `, error);
            res.send({ "status": "failed", "message": `Invalid Token !!` });
        }
    }
}

export default UserController;