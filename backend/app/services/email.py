"""Minimal SMTP sender used by password reset and email verification.
Optimized for Gmail SMTP.
"""
from email.message import EmailMessage

import aiosmtplib

from app.config import settings


async def send_email(to: str, subject: str, html_body: str, text_body: str = "") -> None:
    msg = EmailMessage()
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text_body or html_body)
    msg.add_alternative(html_body, subtype="html")

    # Gmail uses Port 465 for SSL, or Port 587 for STARTTLS.
    # We automatically detect which one to use based on the port.
    use_ssl = settings.SMTP_PORT == 465
    use_tls = settings.SMTP_PORT == 587

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USERNAME,
        password=settings.SMTP_PASSWORD,
        use_tls=use_ssl,        # Implicit SSL for port 465
        start_tls=use_tls,      # STARTTLS for port 587
        validate_certs=True,
    )


def reset_password_email(name: str, link: str) -> tuple[str, str]:
    subject = "Reset your Creators Connect password"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {name},</h2>
        <p>Click the link below to reset your password. It expires in 30 minutes.</p>
        <p>
            <a href="{link}" style="display: inline-block; padding: 10px 20px; background-color: #6845ea; color: white; text-decoration: none; border-radius: 8px;">
                Reset Password
            </a>
        </p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
        <p style="color: #666; font-size: 12px;">Or copy and paste this link into your browser:<br>{link}</p>
    </div>
    """
    return subject, html


def verify_email_email(name: str, link: str) -> tuple[str, str]:
    subject = "Verify your Creators Connect email"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, {name}!</h2>
        <p>Please confirm your email address to secure your account.</p>
        <p>
            <a href="{link}" style="display: inline-block; padding: 10px 20px; background-color: #6845ea; color: white; text-decoration: none; border-radius: 8px;">
                Verify Email
            </a>
        </p>
        <p style="color: #666; font-size: 12px;">Or copy and paste this link into your browser:<br>{link}</p>
    </div>
    """
    return subject, html