"""
Email Service
-------------
Async email sending via SendGrid.
Templates: welcome, verification, password reset, analysis complete,
subscription confirmation, carbon offset certificate, monthly report.
"""

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    return bool(settings.smtp_username and settings.smtp_password)


async def _send_email(
    to_email: str,
    subject: str,
    html_content: str,
    plain_content: Optional[str] = None,
    attachment_bytes: Optional[bytes] = None,
    attachment_name: Optional[str] = None,
) -> bool:
    """
    Send a single email via SendGrid.

    Returns:
        True if sent, False on failure or if not configured.
    """
    if not _is_configured():
        logger.debug(f"📧 [EMAIL - Not sent - SMTP not configured] To: {to_email} | Subject: {subject}")
        return False

    try:
        import aiosmtplib
        from email.message import EmailMessage

        message = EmailMessage()
        message["From"] = f"{settings.from_name} <{settings.from_email}>"
        message["To"] = to_email
        message["Subject"] = subject

        message.set_content(plain_content or _html_to_plain(html_content))
        message.add_alternative(html_content, subtype="html")

        if attachment_bytes and attachment_name:
            message.add_attachment(
                attachment_bytes,
                maintype="application",
                subtype="pdf",
                filename=attachment_name,
            )

        if settings.smtp_port == 465:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_server,
                port=settings.smtp_port,
                username=settings.smtp_username,
                password=settings.smtp_password,
                use_tls=True,
            )
        else:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_server,
                port=settings.smtp_port,
                username=settings.smtp_username,
                password=settings.smtp_password,
                start_tls=True,
            )

        logger.info(f"Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        logger.error(f"Email send failed to {to_email}: {e}")
        return False


def _html_to_plain(html: str) -> str:
    """Strip HTML tags for plain text fallback."""
    import re
    return re.sub(r"<[^>]+>", "", html).strip()


# ── Email Template Functions ───────────────────────────────────────────────────

async def send_welcome_email(user_email: str, user_name: str) -> bool:
    """Send a welcome email to a newly registered user."""
    first_name = user_name.split()[0]
    html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #eaeaea;">
      <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to EcoCart 🌱</h1>
      </div>
      <div style="padding: 40px 30px;">
        <p style="color: #333333; font-size: 18px; line-height: 1.6; margin-top: 0;">Hi <strong>{first_name}</strong>,</p>
        <p style="color: #555555; font-size: 16px; line-height: 1.6;">Thank you for joining our sustainable shopping community. Together, we're making the planet greener, one receipt at a time.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
          <h2 style="color: #166534; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Here's how to get started:</h2>
          <ul style="color: #15803d; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0;">
            <li>📸 <strong>Upload your receipt</strong> — snap any grocery or shopping bill</li>
            <li>🤖 <strong>Get eco analysis</strong> — our AI calculates your carbon footprint</li>
            <li>🛒 <strong>Discover swaps</strong> — find eco-friendly alternatives</li>
            <li>🌍 <strong>Track progress</strong> — watch your global impact grow</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="{settings.frontend_url}" style="background-color: #16a34a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
            Start Your First Analysis →
          </a>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          You're receiving this because you signed up for EcoCart.<br>
          <a href="{settings.frontend_url}/settings" style="color: #16a34a; text-decoration: none;">Manage Preferences</a>
        </p>
      </div>
    </div>
    """
    return await _send_email(user_email, "🌿 Welcome to EcoCart!", html)


async def send_verification_email(user_email: str, verification_link: str) -> bool:
    """Send email verification link."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2d7a27;">Verify Your EcoCart Email</h1>
      <p>Please click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="{verification_link}" style="background:#2d7a27;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
        Verify Email Address →
      </a>
      <p style="color:#666;">If you didn't create an EcoCart account, please ignore this email.</p>
      <p style="color:#666;font-size:12px;">Link: {verification_link}</p>
    </div>
    """
    return await _send_email(user_email, "Verify Your EcoCart Email", html)


async def send_password_reset_email(user_email: str, reset_link: str) -> bool:
    """Send password reset link with security notice."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2d7a27;">Reset Your Password</h1>
      <p>You requested a password reset for your EcoCart account. Click below to create a new password.</p>
      <p><strong>⚠️ This link expires in 1 hour.</strong></p>
      <a href="{reset_link}" style="background:#e74c3c;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
        Reset Password →
      </a>
      <p style="color:#666;">If you didn't request this, your account may be at risk. 
        Please <a href="mailto:{settings.from_email}">contact support</a> immediately.</p>
    </div>
    """
    return await _send_email(user_email, "Reset Your EcoCart Password", html)


async def send_analysis_complete_email(
    user_email: str,
    user_name: str,
    eco_score: int,
    total_carbon_kg: float,
    top_contributors: list,
    analysis_url: str,
) -> bool:
    """Send analysis completion summary email."""
    first_name = user_name.split()[0]
    contributors_html = "".join(f"<li>{c}</li>" for c in top_contributors[:3])
    score_color = "#2d7a27" if eco_score >= 70 else ("#f39c12" if eco_score >= 50 else "#e74c3c")
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2d7a27;">🌿 Your EcoCart Analysis is Ready!</h1>
      <p>Hi {first_name}, here's your receipt analysis summary:</p>
      <div style="text-align:center;padding:20px;background:#f9f9f9;border-radius:8px;margin:16px 0;">
        <div style="font-size:48px;font-weight:bold;color:{score_color};">{eco_score}</div>
        <div style="color:#666;">Eco Score / 100</div>
        <div style="font-size:24px;margin-top:8px;">🌍 {total_carbon_kg:.2f} kg CO₂e</div>
      </div>
      <h3>Top Carbon Contributors:</h3>
      <ul>{contributors_html}</ul>
      <a href="{analysis_url}" style="background:#2d7a27;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
        View Full Analysis →
      </a>
    </div>
    """
    return await _send_email(user_email, f"🌿 Your EcoCart Analysis: Eco Score {eco_score}/100", html)



async def send_carbon_offset_certificate(
    user_email: str,
    user_name: str,
    offset_kg: float,
    project_name: str,
    certificate_bytes: Optional[bytes] = None,
) -> bool:
    """Send carbon offset confirmation with optional PDF certificate."""
    trees_equivalent = int(offset_kg / 21)  # A tree absorbs ~21 kg CO2/year
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2d7a27;">🌱 You've Offset {offset_kg:.1f} kg of CO₂!</h1>
      <p>Congratulations, {user_name}! Your carbon offset contribution has been processed and verified.</p>
      <div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0;text-align:center;">
        <div style="font-size:36px;">🌳</div>
        <div style="font-size:20px;font-weight:bold;">~{trees_equivalent} trees' worth of CO₂ offset</div>
        <div style="color:#666;">via {project_name}</div>
      </div>
      {'<p>📎 Your certificate is attached to this email.</p>' if certificate_bytes else ''}
      <p>Share your impact on social media and inspire others to join the sustainable movement!</p>
      <a href="{settings.frontend_url}/dashboard" style="background:#2d7a27;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
        View My Impact →
      </a>
    </div>
    """
    return await _send_email(
        user_email,
        f"🌱 Carbon Offset Certificate — {offset_kg:.1f} kg CO₂",
        html,
        attachment_bytes=certificate_bytes,
        attachment_name="EcoCart_Carbon_Offset_Certificate.pdf" if certificate_bytes else None,
    )
