const errorHandler = (err, req, res, next) => {
    // mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // invalid object id
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID'
        });
    }

    // duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // jwt errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server error'
    });
};

module.exports = errorHandler;
