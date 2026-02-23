const QRCode = require('qrcode');

/**
 * Generate QR code for event ticket
 * @param {Object} data - Data to encode in QR code
 * @param {string} data.ticketId - Registration/Ticket ID
 * @param {string} data.eventId - Event ID
 * @param {string} data.eventName - Event name
 * @param {string} data.participantId - Participant ID
 * @param {string} data.participantName - Participant full name
 * @param {string} data.participantEmail - Participant email
 * @returns {Promise<string>} - QR code as data URL (base64 image)
 */
const generateTicketQR = async (data) => {
    try {
        // Create a structured JSON string for the QR code
        const qrData = JSON.stringify({
            ticketId: data.ticketId,
            eventId: data.eventId,
            eventName: data.eventName,
            participantId: data.participantId,
            participantName: data.participantName,
            participantEmail: data.participantEmail,
            registrationDate: data.registrationDate || new Date().toISOString(),
            type: 'FELICITY_EVENT_TICKET'
        });

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300
        });

        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Verify QR code data
 * @param {string} qrData - Scanned QR code data (JSON string)
 * @returns {Object} - Parsed and verified ticket data
 */
const verifyTicketQR = (qrData) => {
    try {
        const data = JSON.parse(qrData);

        if (data.type !== 'FELICITY_EVENT_TICKET') {
            throw new Error('Invalid QR code type');
        }

        return {
            valid: true,
            ticketId: data.ticketId,
            eventId: data.eventId,
            eventName: data.eventName,
            participantId: data.participantId,
            participantName: data.participantName,
            participantEmail: data.participantEmail,
            registrationDate: data.registrationDate
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Invalid QR code data'
        };
    }
};

module.exports = {
    generateTicketQR,
    verifyTicketQR
};
