class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong",
        error = [],
        statak = "") {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.error = error;
        this.data = null;
        this.sussess = false;

        if (statak) {
            this.stack = statak;
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }