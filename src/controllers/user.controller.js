import { User } from "../models/user.model.js";
import { ApiRespose } from "../utils/APIResponse.js";
import { ApiError } from "../utils/APIsRequestError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js"


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



export { registerUser }