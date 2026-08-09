import { escapeHtml } from "../utils/htmlEscape.js";

/**
 * Admin login security alert — layout inspired by premium SaaS security notices,
 * styled with GenValue brand tokens (paper, navy, brand blue, gold, emerald).
 */
export function buildAdminLoginAlertEmailHtml({
  adminName,
  adminEmail,
  roleLabel,
  loginDate,
  loginTime,
  timeZoneLabel,
  ipAddress,
  recipientKind = "actor",
  contactEmail = "genvalue.academy@gmail.com",
}) {
  const safeName = escapeHtml(adminName);
  const safeEmail = escapeHtml(adminEmail);
  const safeRole = escapeHtml(roleLabel);
  const safeDate = escapeHtml(loginDate);
  const safeTime = escapeHtml(loginTime);
  const safeZone = escapeHtml(timeZoneLabel || "");
  const safeIp = escapeHtml(ipAddress || "Unknown");
  const safeContact = escapeHtml(contactEmail);

  const isWatcher = recipientKind === "watcher";
  const greeting = isWatcher ? "Hello," : `Hello ${safeName},`;
  const bannerTitle = "New Admin Login Detected";
  const bannerBody = isWatcher
    ? `An authorized admin just signed in to the GenValue admin portal (<strong>${safeEmail}</strong> · ${safeRole}). If this was unexpected, revoke access immediately.`
    : "We noticed a new login to your admin account. If this was you, no action is needed.";
  const recommendation = isWatcher
    ? `If you did not expect this login, revoke the admin from <strong>Authorized Admins</strong> and contact <a href="mailto:${safeContact}" style="color:#1E3FE0;font-weight:700;text-decoration:none;">${safeContact}</a>.`
    : `If you did not initiate this login, please <strong>contact GenValue support immediately</strong> at <a href="mailto:${safeContact}" style="color:#1E3FE0;font-weight:700;text-decoration:none;">${safeContact}</a> and ask a super admin to revoke access.`;

  const zoneRow = safeZone
    ? `<tr>
                        <td style="padding:12px 16px;border-bottom:1px solid rgba(30,63,224,0.1);">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size:13px;color:#6B6558;">Region / Time zone</td>
                              <td align="right" style="font-size:13px;font-weight:800;color:#2A2A28;">${safeZone}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GenValue — Security Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE6D3;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EDE6D3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.02em;line-height:1.1;">
                <span style="color:#1E3FE0;">Gen</span><span style="color:#12266E;">Value</span>
              </p>
              <p style="margin:8px 0 0;font-size:14px;font-weight:700;color:#2A2A28;">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F6F1E4;border:1px solid rgba(0,0,0,0.08);border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(13,27,42,0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:20px 22px;background-color:#FEF3C7;border-left:4px solid #F59E0B;">
                    <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#92400E;">${bannerTitle}</p>
                    <p style="margin:0;font-size:13px;line-height:1.55;color:#B45309;">${bannerBody}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 22px 8px;">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6B6558;">${greeting}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 22px 18px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EEF2FF;border-radius:12px;overflow:hidden;">
                      <tr>
                        <td style="padding:12px 16px;border-bottom:1px solid rgba(30,63,224,0.1);">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size:13px;color:#6B6558;">Date</td>
                              <td align="right" style="font-size:13px;font-weight:800;color:#2A2A28;">${safeDate}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 16px;border-bottom:1px solid rgba(30,63,224,0.1);">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size:13px;color:#6B6558;">Time</td>
                              <td align="right" style="font-size:13px;font-weight:800;color:#2A2A28;">${safeTime}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${zoneRow}
                      <tr>
                        <td style="padding:12px 16px;border-bottom:1px solid rgba(30,63,224,0.1);">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size:13px;color:#6B6558;">Admin Email</td>
                              <td align="right" style="font-size:13px;font-weight:800;color:#2A2A28;word-break:break-all;">${safeEmail}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size:13px;color:#6B6558;">IP Address</td>
                              <td align="right" style="font-size:13px;font-weight:800;color:#2A2A28;">${safeIp}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 22px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EFF6FF;border:1px solid rgba(30,63,224,0.2);border-radius:12px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#1E3FE0;">Security Recommendation</p>
                          <p style="margin:0;font-size:13px;line-height:1.55;color:#2A2A28;">${recommendation}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 8px 0;">
              <p style="margin:0;font-size:11px;color:#6B6558;">GenValue · Automated security alert · Do not reply</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildAdminLoginAlertEmailText({
  adminName,
  adminEmail,
  roleLabel,
  loginDate,
  loginTime,
  timeZoneLabel,
  ipAddress,
  recipientKind = "actor",
  contactEmail = "genvalue.academy@gmail.com",
}) {
  const isWatcher = recipientKind === "watcher";
  return [
    "GenValue — Security Alert",
    "",
    "New Admin Login Detected",
    isWatcher
      ? `An authorized admin signed in (${adminEmail} · ${roleLabel}).`
      : "We noticed a new login to your admin account. If this was you, no action is needed.",
    "",
    isWatcher ? "Hello," : `Hello ${adminName},`,
    `Date: ${loginDate}`,
    `Time: ${loginTime}`,
    timeZoneLabel ? `Region / Time zone: ${timeZoneLabel}` : null,
    `Admin Email: ${adminEmail}`,
    `IP Address: ${ipAddress || "Unknown"}`,
    "",
    "Security Recommendation",
    isWatcher
      ? `If unexpected, revoke access in Authorized Admins and contact ${contactEmail}.`
      : `If you did not initiate this login, contact ${contactEmail} immediately.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
