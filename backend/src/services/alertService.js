// alertService.js — Sends email alerts when drift is detected
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendDriftAlert({ toEmail, terraformDir, scannedAt }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CloudAlarm <onboarding@resend.dev>',
      to: toEmail,
      subject: '🚨 Drift Detected — CloudAlarm Alert',
      html: `
        <div style="font-family: monospace; background: #020208; color: #e8eaf0; padding: 32px; border-radius: 12px; max-width: 600px;">
          <h1 style="color: #ff4466; margin-bottom: 8px;">🚨 Drift Detected</h1>
          <p style="color: #a8b4cc; margin-bottom: 24px;">
            CloudAlarm detected infrastructure drift in your Terraform project.
          </p>
          <div style="background: #07070f; border: 1px solid #ff446630; border-left: 3px solid #ff4466; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="color: #5a6aaa; font-size: 11px; letter-spacing: 1px; margin-bottom: 6px;">TARGET PATH</div>
            <div style="color: #d8e2f4; font-size: 13px;">${terraformDir}</div>
          </div>
          <div style="background: #07070f; border: 1px solid #15152a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="color: #5a6aaa; font-size: 11px; letter-spacing: 1px; margin-bottom: 6px;">DETECTED AT</div>
            <div style="color: #d8e2f4; font-size: 13px;">${new Date(scannedAt).toLocaleString()}</div>
          </div>
          <p style="color: #5a6aaa; font-size: 12px;">
            Your live infrastructure no longer matches your Terraform code. 
            Login to CloudAlarm to review the changes.
          </p>
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #15152a;">
            <p style="color: #3a3a6a; font-size: 11px;">CloudAlarm — Infrastructure Drift Detection</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Email alert failed:', error);
      return false;
    }

    console.log('📧 Drift alert email sent:', data?.id);
    return true;
  } catch (err) {
    console.error('❌ Email alert error:', err);
    return false;
  }
}

module.exports = { sendDriftAlert };