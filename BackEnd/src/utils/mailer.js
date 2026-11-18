// Sends emails over SMTP using the settings in .env.
// If SMTP isn't configured yet (e.g. in development), emails aren't sent -
// the subject and any links are printed to the console instead.

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
    if (!process.env.SMTP_HOST) return null;

    if (!transporter) {
        const port = Number(process.env.SMTP_PORT || 587);

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            // Port 465 uses SSL from the start; 587 upgrades with STARTTLS
            secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
            auth: process.env.SMTP_USER
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined,
        });
    }

    return transporter;
}

// The address the app is served from, used to build links in emails.
// Change APP_URL in .env when the app is hosted.
function appUrl(path) {
    const base = (process.env.APP_URL || "http://localhost:8081").replace(/\/+$/, "");
    return `${base}${path}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Simple branded email with one call-to-action button
function buildEmailHtml({ heading, paragraphs, buttonLabel, buttonUrl, footer }) {
    const body = paragraphs
        .map((text) => `<p style="margin:0 0 16px;color:#d1d5db;font-size:15px;line-height:22px;">${escapeHtml(text)}</p>`)
        .join("");

    return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr><td style="padding-bottom:20px;color:#ffffff;font-size:20px;font-weight:bold;text-align:center;">Pitlane Mini</td></tr>
          <tr><td style="background:#1f2937;border:1px solid #374151;border-radius:16px;padding:28px;">
            <h1 style="margin:0 0 16px;color:#ffffff;font-size:22px;">${escapeHtml(heading)}</h1>
            ${body}
            <p style="margin:24px 0;">
              <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;">${escapeHtml(buttonLabel)}</a>
            </p>
            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:20px;">
              If the button doesn't work, copy this link into your browser:<br>
              <span style="color:#93c5fd;word-break:break-all;">${escapeHtml(buttonUrl)}</span>
            </p>
          </td></tr>
          <tr><td style="padding-top:16px;color:#6b7280;font-size:12px;text-align:center;">${escapeHtml(footer)}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendEmail({ to, subject, text, html }) {
    const smtp = getTransporter();

    if (!smtp) {
        console.log("\n[mailer] SMTP not configured - email not sent. Would have sent:");
        console.log(`  To: ${to}\n  Subject: ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`);
        return;
    }

    await smtp.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });
}

async function sendInviteEmail({ to, inviteeName, inviterName, organisationName, token }) {
    const link = appUrl(`/accept-invite?token=${token}`);
    const greeting = inviteeName ? `Hi ${inviteeName},` : "Hi,";
    const intro = `${inviterName || "Your team admin"} has invited you to join ${organisationName} on Pitlane Mini.`;

    await sendEmail({
        to,
        subject: `You've been invited to ${organisationName} on Pitlane Mini`,
        text: `${greeting}\n\n${intro}\n\nSet up your account here (link expires in 72 hours):\n${link}`,
        html: buildEmailHtml({
            heading: "You're invited",
            paragraphs: [greeting, intro, "Click below to choose your password. The link expires in 72 hours."],
            buttonLabel: "Set up your account",
            buttonUrl: link,
            footer: "If you weren't expecting this invite, you can ignore this email.",
        }),
    });
}

async function sendPasswordResetEmail({ to, name, token }) {
    const link = appUrl(`/reset-password?token=${token}`);
    const greeting = name ? `Hi ${name},` : "Hi,";

    await sendEmail({
        to,
        subject: "Reset your Pitlane Mini password",
        text: `${greeting}\n\nWe received a request to reset your password.\n\nReset it here (link expires in 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        html: buildEmailHtml({
            heading: "Reset your password",
            paragraphs: [greeting, "We received a request to reset your Pitlane Mini password. The link expires in 1 hour."],
            buttonLabel: "Reset password",
            buttonUrl: link,
            footer: "If you didn't ask to reset your password, you can ignore this email.",
        }),
    });
}

module.exports = { sendInviteEmail, sendPasswordResetEmail };
