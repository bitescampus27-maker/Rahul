import { OAuth2Client } from "google-auth-library";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const googleLoginUser = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({
        success: false,
        message: "Google token missing",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res.json({
        success: false,
        message: "Email not received from Google",
      });
    }

    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({
        name,
        email,
        password: "google-auth",
        image: picture,
      });
    }

    const authToken = createToken(user._id);

    res.json({
      success: true,
      token: authToken,
      user,
    });

  } catch (error) {
    console.log("GOOGLE LOGIN ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Google Login Failed",
    });
  }
};

export default googleLoginUser;