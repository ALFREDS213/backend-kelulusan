const jwt = require('jsonwebtoken');
const response = require('../utils/response');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return response.error(res, 'Token tidak ada', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (err) {
        return response.error(res, 'Token tidak valid', 401);
    }
};