import { requestAdminOtp, verifyAdminOtp } from "../services/otpService.js";
import { getClientIpFromRequest } from "../utils/adminLoginAlert.js";

export async function sendAdminOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await requestAdminOtp(email);

    return res.status(result.status).json({
      success: result.ok,
      message: result.message,
      ...(result.hint ? { hint: result.hint } : {}),
    });
  } catch (error) {
    console.error("[adminOtp] send error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
}

export async function verifyAdminOTP(req, res) {
  try {
    const { email, otp, timeZone } = req.body;
    const otpValue = String(otp ?? "").trim();

    if (!email?.trim() || !otpValue) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const result = await verifyAdminOtp(email, otpValue, {
      ipAddress: getClientIpFromRequest(req),
      userAgent: req.headers["user-agent"],
      timeZone,
    });

    return res.status(result.status).json({
      success: result.ok,
      message: result.message,
      ...(result.data ? { data: result.data } : {}),
    });
  } catch (error) {
    console.error("[adminOtp] verify error:", error);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
}
