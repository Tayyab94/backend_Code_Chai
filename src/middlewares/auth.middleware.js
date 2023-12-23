import { User } from "../models/user.model";
import { ApiError } from "../utils/APIsRequestError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "UnAuthorize Access")
        }

        const decodedTokenInfor = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedTokenInfor?._id).select("-password -refreshtoken");

        if (!user) {

            // Next_Video : discuss About the  fronend
            throw new ApiError(401, "Invalid Acccess Token")
        }

        req.user = user;

        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access token");
    }
})