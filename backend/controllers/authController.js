import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 15);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const normalizedEmail = (email) => email?.trim().toLowerCase();

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", getRefreshCookieOptions());
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

const issueAuthTokens = async (user) => {
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = hashToken(refreshToken);
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

const getClientBaseUrl = () => {
  const clientUrls = (process.env.CLIENT_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (clientUrls.length > 0) {
    return clientUrls[0];
  }

  return (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  );
};

const sendAccountCreatedEmail = async (user) => {
  const clientBaseUrl = getClientBaseUrl().replace(/\/$/, "");
  const loginUrl = `${clientBaseUrl}/login`;
  const logoUrl = `${clientBaseUrl}/assets/logos/Naashpati.png`;
  const message = `Welcome to Naashpati, ${user.firstName}! Your account has been created successfully. You can sign in here: ${loginUrl}`;
  const html = `
    <div style="margin:0;padding:24px;background:#f6f8f2;font-family:Arial,sans-serif;color:#1f2937;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="padding:18px 24px;background:#ffffff;border-bottom:1px solid #e5e7eb;text-align:center;">
            <img src="${logoUrl}" alt="Naashpati" width="170" style="display:inline-block;max-width:170px;height:auto;border:0;outline:none;text-decoration:none;" />
            <div style="margin-top:8px;font-size:12px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;">Naashpati</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 14px 24px;">
            <h1 style="margin:0 0 10px 0;font-size:22px;line-height:1.3;color:#111827;">Welcome, ${user.firstName}!</h1>
            <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">
              Your Naashpati account has been created successfully.
            </p>
            <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#374151;">
              You can now sign in and start exploring our products.
            </p>
            <a href="${loginUrl}" style="display:inline-block;padding:12px 18px;background:#68a300;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;">
              Sign In to Your Account
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 24px 24px;">
            <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
              If the button does not work, copy and paste this link into your browser:<br />
              <a href="${loginUrl}" style="color:#68a300;text-decoration:underline;word-break:break-all;">${loginUrl}</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: "Your Naashpati account is ready",
    message,
    html,
  });
};

const getRemainingLockMinutes = (lockUntil) => {
  const diff = Number(lockUntil) - Date.now();
  return Math.max(1, Math.ceil(diff / (60 * 1000)));
};

const registerFailedLoginAttempt = async (user) => {
  const attempts = (user.loginAttempts || 0) + 1;

  if (attempts >= LOGIN_MAX_ATTEMPTS) {
    user.loginAttempts = 0;
    user.lockUntil = Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000;
  } else {
    user.loginAttempts = attempts;
  }

  await user.save({ validateBeforeSave: false });

  if (user.lockUntil && user.lockUntil > Date.now()) {
    return {
      locked: true,
      remainingMinutes: getRemainingLockMinutes(user.lockUntil),
    };
  }

  return {
    locked: false,
    attemptsLeft: Math.max(0, LOGIN_MAX_ATTEMPTS - attempts),
  };
};

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  const firstName = req.body.firstName?.trim();
  const lastName = req.body.lastName?.trim();
  const email = normalizedEmail(req.body.email);
  const { password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    try {
      await sendAccountCreatedEmail(user);
    } catch (error) {
      console.error(
        "Account creation email failed:",
        error?.stack || error?.message || error,
      );
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now log in.",
      data: { email: user.email },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  const email = normalizedEmail(req.body.email);
  const { password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        error: `Account temporarily locked. Try again in ${getRemainingLockMinutes(user.lockUntil)} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const lockState = await registerFailedLoginAttempt(user);

      if (lockState.locked) {
        return res.status(423).json({
          success: false,
          error: `Too many failed attempts. Account locked for ${lockState.remainingMinutes} minute(s).`,
        });
      }

      return res.status(401).json({
        success: false,
        error: `Invalid credentials. ${lockState.attemptsLeft} attempt(s) remaining.`,
      });
    }

    const authPayload = await issueAuthTokens(user);
    setRefreshCookie(res, authPayload.refreshToken);

    res.json({
      success: true,
      data: {
        user: authPayload.user,
        accessToken: authPayload.accessToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const refreshToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      success: false,
      error: "Refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET,
    );
    const user = await User.findById(decoded.id);
    const incomingTokenHash = hashToken(incomingRefreshToken);

    if (!user || user.refreshToken !== incomingTokenHash) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    const accessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });
    setRefreshCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid refresh token",
    });
  }
};

export const logout = async (req, res) => {
  try {
    req.user.refreshToken = null;
    req.user.twoFactorCodeHash = undefined;
    req.user.twoFactorCodeExpire = undefined;
    await req.user.save({ validateBeforeSave: false });
    clearRefreshCookie(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const email = normalizedEmail(req.body.email);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists for that email, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getClientBaseUrl()}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) requested a password reset. Open this link: ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      });

      res.json({
        success: true,
        message:
          "If an account exists for that email, a password reset link has been sent.",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: "Email could not be sent",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid token",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user,
  });
};
