import jwt from "jsonwebtoken";

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

    // 3️⃣ If still no token → guest user allowed
    if (!token) {
      req.body.userId = null;
      return next();
    }

    // 4️⃣ Verify token safely
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.body.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

export default authMiddleware;
