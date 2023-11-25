import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, "./Public/Temp")
    },
    filename: function (req, file, cb) {

        // we can customize the file name as well.

        cb(null, file.originalname)
    }
});


export const upload = multer({
    storage
});