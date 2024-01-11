import { Router } from "express"
import {
    loginUser, logoutUser, refreshAccessToken, registerUser, ChangeCurrentPassword, getCurrentUser,
    updateAccountDetails
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route("/loginuser").post(loginUser);

// secure Route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-user-password").post(verifyJWT, ChangeCurrentPassword);
router.route("/get-current-user").post(verifyJWT, getCurrentUser);
router.route("/update-account-detail").post(verifyJWT, updateAccountDetails);




export default router