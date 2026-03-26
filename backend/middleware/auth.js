import jwt from "jsonwebtoken";
import cors from 'cors';

const authMiddleware = (req, res, next) => {
  try {
    let token = null;

    // 1️⃣ Check Authorization header (Bearer token)
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    // 2️⃣ Fallback to custom token header
    if (!token && req.headers.token) {
      token = req.headers.token;
    }

    // 3️⃣ If no token → guest user (public routes)
    if (!token) {
      req.body.userId = null;
      req.user = { id: null, role: 'guest' };
      return next();
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = decoded.id;
    req.user = decoded; // Full user object

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

export default authMiddleware;
