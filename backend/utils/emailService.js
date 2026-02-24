const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    // Use environment variables for email configuration
    // For development, you can use services like Gmail, Ethereal, or Mailtrap
    // For production, use a proper email service like SendGrid, AWS SES, etc.

    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    } else {
        // Default to SMTP configuration
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
};

/**
 * Send event registration ticket via email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {Object} options.participant - Participant details
 * @param {Object} options.event - Event details
 * @param {Object} options.registration - Registration details
 * @param {string} options.qrCodeDataUrl - QR code image data URL (optional)
 */
const sendTicketEmail = async ({ to, participant, event, registration, qrCodeDataUrl }) => {
    try {
        // Skip if email is not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('Email not configured. Skipping email send.');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter();

        const startDate = new Date(event.startDate).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const endDate = new Date(event.endDate).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Build email HTML content
        let emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                    .ticket-id { background-color: #000; color: #fff; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; }
                    .detail-row { margin: 10px 0; }
                    .detail-label { font-weight: bold; display: inline-block; width: 150px; }
                    .qr-code { text-align: center; margin: 20px 0; }
                    .qr-code img { max-width: 200px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Event Registration Confirmed</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${participant.firstName} ${participant.lastName},</h2>
                        <p>Thank you for registering for <strong>${event.name}</strong>!</p>

                        <div class="ticket-id">
                            TICKET ID: ${registration._id}
                        </div>

                        <h3>Event Details:</h3>
                        <div class="detail-row">
                            <span class="detail-label">Event Name:</span> ${event.name}
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Event Type:</span> ${event.eventType}
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Organizer:</span> ${event.organizerId.organizerName}
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Start Time:</span> ${startDate}
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">End Time:</span> ${endDate}
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Location:</span> ${event.locationOfEvent}
                        </div>
                        ${registration.registrationType === 'Merchandise' ? `
                        <div class="detail-row">
                            <span class="detail-label">Variant:</span> ${registration.selectedVariant}
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Quantity:</span> ${registration.quantity}
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Total Amount:</span> Rs.${registration.totalAmount}
                        </div>
                        ` : ''}

                        ${qrCodeDataUrl ? `
                        <div class="qr-code">
                            <h3>Your QR Code:</h3>
                            <img src="${qrCodeDataUrl}" alt="QR Code" />
                            <p style="font-size: 12px; color: #666;">Present this QR code at the event venue</p>
                        </div>
                        ` : ''}

                        <p style="margin-top: 20px;">
                            Please save this email for your records. You'll need to present your ticket ID or QR code at the event venue.
                        </p>

                        <p>
                            If you have any questions, please contact the organizer at
                            <a href="mailto:${event.organizerId.contactEmail}">${event.organizerId.contactEmail}</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email from Felicity Event Management System</p>
                        <p>© ${new Date().getFullYear()} Felicity. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Felicity Events" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `✅ Registration Confirmed: ${event.name}`,
            html: emailHtml
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendTicketEmail
};
