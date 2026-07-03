
const errorHandler = (err, req, res, next) => {
    console.error("Error Caught by Global Handler:", err);

    
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.status || res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};

module.exports = errorHandler;
