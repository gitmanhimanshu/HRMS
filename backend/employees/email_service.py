"""
Email Service using Brevo API (Production Safe)
No SMTP connection issues on Render
Uses existing environment variable names:
  EMAIL_HOST_PASSWORD as Brevo API key
"""
import requests
from django.conf import settings

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

def send_otp_email(to_email, otp, user_name=None):
    """
    Send OTP email using Brevo API
    
    Args:
        to_email: Recipient email address
        otp: OTP code to send
        user_name: Optional user name
        
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        # Get API key from EMAIL_HOST_PASSWORD (existing variable)
        api_key = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        if not api_key:
            print("⚠️ EMAIL_HOST_PASSWORD (Brevo API key) not configured")
            return False, "Email service not configured"
        
        # Get sender email from DEFAULT_FROM_EMAIL (existing variable)
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hrms.com')
        
        # Prepare headers
        headers = {
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json"
        }
        
        # Prepare recipient name
        name = user_name or "User"
        
        # Prepare email payload
        payload = {
            "sender": {
                "name": "HRMS Lite",
                "email": from_email
            },
            "to": [
                {"email": to_email, "name": name}
            ],
            "subject": "HRMS Lite - Password Reset OTP",
            "htmlContent": f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .otp-box {{ background: white; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }}
        .otp-code {{ font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HRMS Lite</h1>
        </div>
        <div class="content">
            <h2>Hello {name},</h2>
            <p>You requested to reset your password for your HRMS Lite account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div class="otp-box">
                <div class="otp-code">{otp}</div>
            </div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email or contact your admin.</p>
            <p>Best regards,<br>HRMS Lite Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""
        }
        
        # Log email attempt
        print(f"📧 Sending OTP email via Brevo API")
        print(f"   To: {to_email}")
        print(f"   Name: {name}")
        print(f"   OTP: {otp}")
        print(f"   From: {from_email}")
        
        # Send email via Brevo API
        response = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=10)
        
        # Check response
        if response.status_code in [200, 201]:
            print(f"✓ Email sent successfully via Brevo API")
            print(f"   Response: {response.text}")
            return True, "Email sent successfully"
        else:
            error_msg = f"Brevo API error: {response.status_code} - {response.text}"
            print(f"⚠️ {error_msg}")
            return False, error_msg
            
    except requests.exceptions.Timeout:
        error_msg = "Email service timeout"
        print(f"⚠️ {error_msg}")
        return False, error_msg
    except Exception as e:
        error_msg = f"Email error: {type(e).__name__}: {str(e)}"
        print(f"⚠️ {error_msg}")
        return False, error_msg


def send_invitation_email(to_email, invitation_link, company_name, inviter_name):
    """Send invitation email using Brevo API
    
    Args:
        to_email: Recipient email address
        invitation_link: Full invitation URL
        company_name: Name of the company
        inviter_name: Name of person who sent invitation
    
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        # Get API key from EMAIL_HOST_PASSWORD
        api_key = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        if not api_key:
            print("⚠️ EMAIL_HOST_PASSWORD (Brevo API key) not configured")
            return False, "Email service not configured"
        
        # Get sender email
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hrms.com')
        
        # Prepare headers
        headers = {
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json"
        }
        
        # Prepare email payload
        payload = {
            "sender": {
                "name": "HRMS Lite",
                "email": from_email
            },
            "to": [{"email": to_email}],
            "subject": f"Invitation to join {company_name}",
            "htmlContent": f"""
<!DOCTYPE html>
<html>
<head>
<style>
body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
.container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
.header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
.content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
.button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
.footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>HRMS Lite</h1>
<p>You're Invited!</p>
</div>
<div class="content">
<h2>Hello!</h2>
<p><strong>{inviter_name}</strong> has invited you to join <strong>{company_name}</strong> on HRMS Lite.</p>
<p>Click the button below to accept the invitation and create your account:</p>
<div style="text-align: center;">
<a href="{invitation_link}" class="button">Accept Invitation</a>
</div>
<p>Or copy and paste this link in your browser:</p>
<p style="word-break: break-all; color: #667eea;">{invitation_link}</p>
<p><strong>This invitation link is valid until you accept it.</strong></p>
<p>If you didn't expect this invitation, you can safely ignore this email.</p>
<p>Best regards,<br>HRMS Lite Team</p>
</div>
<div class="footer">
<p>This is an automated email. Please do not reply.</p>
</div>
</div>
</body>
</html>
"""
        }
        
        # Log email attempt
        print(f"📧 Sending invitation email via Brevo API")
        print(f"   To: {to_email}")
        print(f"   Company: {company_name}")
        print(f"   From: {from_email}")
        
        # Send email via Brevo API
        response = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=10)
        
        # Check response
        if response.status_code in [200, 201]:
            print(f"✓ Invitation email sent successfully")
            return True, "Invitation email sent successfully"
        else:
            error_msg = f"Brevo API error: {response.status_code} - {response.text}"
            print(f"⚠️ {error_msg}")
            return False, error_msg
    
    except requests.exceptions.Timeout:
        error_msg = "Email service timeout"
        print(f"⚠️ {error_msg}")
        return False, error_msg
    except Exception as e:
        error_msg = f"Email error: {type(e).__name__}: {str(e)}"
        print(f"⚠️ {error_msg}")
        return False, error_msg
