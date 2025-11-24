// To verify the JWT token and attach req.user 

const jwt = require(jsonwebtoken); // Make jsonwebtoken available in this file 

function authMiddleware(req, res, next) { // Define middleware function for express
    const authHeader = req.headers['authorization'] || req.headers['Authorization']; // read authorization heade from incoming requests

    if (!authHeader || !authHeader.startsWith('Bearer ')) { //Check the header exists and is a JWT token
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // retrieve the actual token from the header 

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Check the token is correct return the decoded token payload
        //decoded = {userId, organisationId, role, iat, exp}
        req.user = decoded; // Store the decoded payload 
        next(); // continue if all good
    } catch(err) { // Watching for errors 
        console.error('JWT verify error:', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' }); 
    }
}

module.exports = authMiddleware;