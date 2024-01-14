import { User } from "../models/user.model.js";
import { ApiRespose } from "../utils/APIResponse.js";
import { ApiError } from "../utils/APIsRequestError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";

const GenerateAccessAndRefreshTokens = async (userId) => {
    try {

        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken();


        const refreshToken = await user.generateRefreshToken();

        user.refreshtoken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access & refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get the details from frontend
    // validatiom - Not empty
    // check if the user aleady exist:  username, email
    //check for images -- check avatar
    // upload them to cloudinary, Avatar
    // create user Object, create entry in db
    //remove password and refresh token field from response
    // check the user creation
    // return res

    const { email, username, fullName, password } = req.body;
    console.log(req.body)

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required");
    }

    const existUser = await User.findOne({
        $or: [
            { username }, { email }
        ]
    });

    if (existUser) {
        throw new ApiError(409, "User with email or username already exist")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImamge = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
        coverImage: coverImamge?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshtoken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the User")
    }

    return res.status(201).json(
        new ApiRespose(200, createdUser, "User Registered")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    // req Body ->
    // userName or emial
    // find the user
    // Password check
    // access and refresh token
    // send cookiees

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "UserName or Password is Required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User credentials")
    }


    const { accessToken, refreshToken } = await GenerateAccessAndRefreshTokens(user._id);

    const logedinUser = await User.findById(user._id).select("-password -refreshtoken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiRespose(200, { user: logedinUser, accessToken, refreshToken }, "User LogedIn Successfully"))
})


const logoutUser = asyncHandler(async (req, res) => {

    const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            refreshtoken: null
        }
    }, {
        new: true
    });

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
        .json(new ApiRespose(200, {}, "user Loged Out"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const inCommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

        if (!inCommingRefreshToken) {
            throw new ApiError(401, "UnAuthorized Access");
        }

        const decodedToken = jwt.verify(inCommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (inCommingRefreshToken !== user?.refreshtoken) {
            throw new ApiError(401, "Refresh token is Expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await GenerateAccessAndRefreshTokens(user?._id);

        return res.status(200).cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options).json(new ApiRespose(200, { accessToken, refreshToken }, "Access token Refreshed"))
    } catch (error) {
        throw new ApiError(500, error?.message || "Invalid Refresh Token")
    }
});

const ChangeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassowrd } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassowrd;
    user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiRespose(200, {}, "Password Changed Successfully"));

});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiRespose(200, req.user, "currect user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullName, email } = req.body;

    if (!fullName ||
        !email) {
        throw new ApiError(400, "All fields are required")
    };

    const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email: email
        }
    },
        {
            new: true
        }).select("-password")

    return res.status(200).json(new ApiRespose(200, updatedUser, "user Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while Uploading Avatar file")
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password");

    return res.status(200).json(new ApiRespose(200, updatedUser, "Avatar updated successfully"));
})



const updateUserCoverImage = asyncHandler(async (req, res) => {
    const CoverImageLocalPath = req.file?.path


    if (!CoverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(avatarLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while Uploading Avatar file")
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverimage: coverImage.url
        }
    }, { new: true }).select("-password");

    return res.status(200).json(new ApiRespose(200, updatedUser, "Cover Image updated successfully"));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, `${username} is missing`)
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);


    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res.status(200).json(new ApiRespose(200, channel[0], "User channel fetched successfully"))
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    ChangeCurrentPassword,
    getCurrentUser, updateAccountDetails, updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}