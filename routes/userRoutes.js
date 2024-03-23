import express from "express";

const router = express.Router();

import UserController from "../controllers/userController.js";

import checkUserAuth from "../middlewares/auth-middleware.js";

// ! CREATING ROUTES
// TODO : Router Level Middleware
// Router Level Middleware will be used to Protect the Below Specific Routes from Unauthorized Users
router.use('/changepassword', checkUserAuth);
router.use('/loggeduser', checkUserAuth);

// TODO : Public Routes
// ? Routes that would not Require Login
router.post('/register', UserController.userRegistration);
router.post('/login', UserController.userLogin);
router.post('/send-reset-password-email', UserController.sendUserPasswordResetEmail);
// When the User will click the 'Password Reset Link' Received in the Submitted email address, a Frontend will be Opened whose Backend will use/hit the below 'reset-password' route   
router.post('/reset-password/:id/:token', UserController.userPasswordReset);

// TODO :  Private Routes
// ? Routes that would Require Login
router.post('/changepassword', UserController.changeUserPassword);
router.get('/loggeduser', UserController.loggedUser);

export default router;