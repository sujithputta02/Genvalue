import { escapeHtml } from "../utils/htmlEscape.js";

/**
 * Premium GenValue admin welcome email.
 * Visual language: premium-edutech-ui tokens (paper cream, navy, brand blue, single orange CTA).
 */
export function buildAdminWelcomeEmailHtml({
  email,
  name,
  addedByEmail,
  portalUrl,
  isReactivate = false,
}) {
  const safeEmail = escapeHtml(email);
  const displayName = escapeHtml((name && String(name).trim()) || email.split("@")[0] || "there");
  const safeAddedBy = escapeHtml(addedByEmail || "a GenValue super admin");
  const safePortalUrl = escapeHtml(portalUrl);
  const eyebrow = isReactivate ? "★ Access Restored" : "★ Welcome Aboard";
  const headline = isReactivate
    ? "Your admin access is active again"
    : "You're invited to the GenValue Admin Portal";
  const lead = isReactivate
    ? `Hello ${displayName}, your authorization for <strong style="color:#2A2A28;">${safeEmail}</strong> has been restored by <strong style="color:#2A2A28;">${safeAddedBy}</strong>.`
    : `Hello ${displayName}, <strong style="color:#2A2A28;">${safeAddedBy}</strong> has authorized <strong style="color:#2A2A28;">${safeEmail}</strong> to manage GenValue Academy.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Welcome to GenValue Academy Admin</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE6D3;font-family:Georgia,'Times New Roman',serif;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your GenValue Academy admin portal access is ready. Sign in with a one-time passcode.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EDE6D3;background-image:linear-gradient(rgba(60,50,30,0.06) 1px, transparent 1px),linear-gradient(90deg, rgba(60,50,30,0.06) 1px, transparent 1px);background-size:24px 24px;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#F6F1E4;border:1px solid rgba(60,50,30,0.12);border-radius:20px;overflow:hidden;box-shadow:0 18px 48px rgba(18,38,110,0.14);">
          <!-- Header -->
          <tr>
            <td style="background-color:#12266E;padding:36px 36px 28px;text-align:center;">
              <p style="margin:0 0 10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#E8622E;">
                ${eyebrow}
              </p>
              <h1 style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:28px;font-weight:800;line-height:1.15;letter-spacing:-0.02em;color:#ffffff;">
                <span style="color:#ffffff;">Gen</span><span style="color:#60A5FA;">Value</span>
              </h1>
              <p style="margin:10px 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(255,255,255,0.72);">
                Academy · Admin Portal
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 12px;">
              <p style="margin:0 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6B6558;transform:rotate(-1deg);">
                Choosing the Right AI Tool for Every Task
              </p>
              <h2 style="margin:0 0 18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;line-height:1.25;color:#2A2A28;letter-spacing:-0.02em;">
                ${headline}
              </h2>
              <p style="margin:0 0 20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.65;color:#6B6558;">
                ${lead}
              </p>

              <!-- Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background-color:#ffffff;border:1px solid rgba(30,63,224,0.14);border-radius:16px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 10px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#1E3FE0;">
                      How to sign in
                    </p>
                    <ol style="margin:0;padding:0 0 0 18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.7;color:#2A2A28;">
                      <li style="margin:0 0 6px;">Open the GenValue Admin Portal</li>
                      <li style="margin:0 0 6px;">Enter <strong>${safeEmail}</strong></li>
                      <li style="margin:0;">Use the one-time passcode we email you — no password to remember</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Single accent CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="border-radius:999px;background-color:#E8622E;">
                    <a href="${safePortalUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;color:#ffffff;border-radius:999px;">
                      Admin Portal Login →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.6;color:#6B6558;">
                Direct link to the admin login page:
              </p>
              <p style="margin:0 0 24px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${safePortalUrl}" style="color:#1E3FE0;text-decoration:none;">${safePortalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 36px 30px;border-top:1px solid rgba(60,50,30,0.1);background-color:rgba(255,255,255,0.4);">
              <p style="margin:0 0 6px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.55;color:#6B6558;text-align:center;">
                GenValue Academy · Choosing the Right AI Tool for Every Task
              </p>
              <p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.55;color:#6B6558;text-align:center;">
                Questions?
                <a href="mailto:genvalue.academy@gmail.com" style="color:#1E3FE0;text-decoration:none;font-weight:600;">genvalue.academy@gmail.com</a>
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

export function buildAdminWelcomeEmailText({
  email,
  name,
  addedByEmail,
  portalUrl,
  isReactivate = false,
}) {
  const displayName = (name && String(name).trim()) || email.split("@")[0] || "there";
  const title = isReactivate
    ? "Your GenValue Admin access has been restored"
    : "Welcome to the GenValue Academy Admin Portal";

  return [
    title,
    "",
    `Hello ${displayName},`,
    "",
    isReactivate
      ? `${addedByEmail} restored admin access for ${email}.`
      : `${addedByEmail} authorized ${email} to access the GenValue Academy admin portal.`,
    "",
    "Sign in:",
    `1. Open ${portalUrl}`,
    `2. Enter ${email}`,
    "3. Use the one-time passcode we email you",
    "",
    "— GenValue Academy",
    "Choosing the Right AI Tool for Every Task",
    "genvalue.academy@gmail.com",
  ].join("\n");
}
