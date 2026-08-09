import { escapeHtml } from "../utils/htmlEscape.js";

/**
 * Branded GenValue Academy admin OTP email matching the web UI theme.
 */
export function buildAdminOtpEmailHtml({ otp, email, expiresMinutes = 10 }) {
  const safeOtp = escapeHtml(otp);
  const safeEmail = escapeHtml(email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GenValue Admin Portal — Sign-in Code</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE6D3;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EDE6D3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#F6F1E4;border:1px solid rgba(0,0,0,0.1);border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(13,27,42,0.12);">
          <tr>
            <td style="background-color:#0D1B2A;padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#E8622E;">★ Secure Admin Access</p>
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">
                <span style="color:#ffffff;">Gen</span><span style="color:#60A5FA;">Value</span>
                <span style="display:block;font-size:14px;font-weight:600;color:#94A3B8;margin-top:6px;">Admin Portal</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#2A2A28;">Hello,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6B6558;">
                Use the one-time passcode below to sign in to the GenValue Academy admin portal for
                <strong style="color:#2A2A28;">${safeEmail}</strong>.
              </p>
              <div style="text-align:center;margin:0 0 24px;padding:24px;background-color:#ffffff;border:1px dashed rgba(30,63,224,0.25);border-radius:16px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B6558;">Your 6-digit code</p>
                <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:0.28em;color:#1E3FE0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${safeOtp}</p>
              </div>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6B6558;">
                This code expires in <strong style="color:#2A2A28;">${expiresMinutes} minutes</strong>.
                Do not share it with anyone.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6B6558;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid rgba(0,0,0,0.08);background-color:rgba(255,255,255,0.35);">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#6B6558;text-align:center;">
                GenValue Academy · Choosing the Right AI Tool for Every Task<br />
                <a href="mailto:genvalue.academy@gmail.com" style="color:#1E3FE0;text-decoration:none;">genvalue.academy@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildAdminOtpEmailText({ otp, email, expiresMinutes = 10 }) {
  return [
    "GenValue Academy — Admin Portal Sign-in",
    "",
    `Your one-time passcode for ${email}:`,
    "",
    otp,
    "",
    `This code expires in ${expiresMinutes} minutes.`,
    "Do not share it with anyone.",
    "",
    "If you did not request this code, you can safely ignore this email.",
    "",
    "— GenValue Academy",
  ].join("\n");
}
