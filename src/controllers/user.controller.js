import { User } from "../models/user.model.js";
import { ApiRespose } from "../utils/APIResponse.js";
import { ApiError } from "../utils/APIsRequestError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js"


const GenerateAccessAndRefreshTokens = async (userId) => {
    try {

        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

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

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required");
    }

    const existUser = User.findOne({
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
        avatar: avatar.url,
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

    if (!username || !email) {
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
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            refreshtoken: undefined
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


export { registerUser, loginUser, logoutUser }