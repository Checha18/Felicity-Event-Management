/**
 * Calendar Service - Generate iCal (.ics) files for calendar integration
 * Supports Google Calendar, Apple Calendar, Outlook, and other iCal-compatible apps
 */

/**
 * Generate iCal (.ics) file content for an event
 * @param {Object} event - Event object from database
 * @param {Object} registration - Registration object (optional, for personalized calendar events)
 * @returns {String} - iCal file content
 */
const generateICalContent = (event, registration = null) => {
  // Format dates to iCal format (YYYYMMDDTHHmmssZ)
  const formatICalDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Current timestamp for DTSTAMP
  const now = new Date();
  const dtstamp = formatICalDate(now);

  // Event dates
  const dtstart = formatICalDate(event.startDate);
  const dtend = formatICalDate(event.endDate);

  // Generate unique ID for the event
  const uid = `event-${event._id}@felicity.iiit.ac.in`;

  // Registration-specific info
  const ticketInfo = registration
    ? `\n\nTicket ID: ${registration._id}\nRegistration Date: ${new Date(registration.registrationDate).toLocaleString('en-IN')}`
    : '';

  // Build description
  let description = event.description.replace(/\n/g, '\\n');
  if (ticketInfo) {
    description += ticketInfo.replace(/\n/g, '\\n');
  }

  // Organizer info
  const organizerName = event.organizerId?.organizerName || 'Felicity';
  const organizerEmail = event.organizerId?.contactEmail || 'events@iiit.ac.in';

  // Location
  const location = event.locationOfEvent || 'IIIT Hyderabad';

  // Build iCal content
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Felicity Event Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Felicity Events',
    'X-WR-TIMEZONE:Asia/Kolkata',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    registration ? 'X-MICROSOFT-CDO-BUSYSTATUS:BUSY' : '',
    registration ? 'X-MICROSOFT-CDO-IMPORTANCE:1' : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event reminder - 1 hour before',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');

  return icalContent;
};

/**
 * Generate calendar links for various providers
 * @param {Object} event - Event object
 * @param {Object} registration - Registration object (optional)
 * @returns {Object} - Links for different calendar providers
 */
const generateCalendarLinks = (event, registration = null) => {
  const formatGoogleDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatGoogleDate(event.startDate);
  const endDate = formatGoogleDate(event.endDate);

  // Event details
  const title = encodeURIComponent(event.name);
  const description = encodeURIComponent(
    event.description + (registration ? `\n\nTicket ID: ${registration._id}` : '')
  );
  const location = encodeURIComponent(event.locationOfEvent || 'IIIT Hyderabad');

  // Google Calendar link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}&location=${location}`;

  // Outlook.com link
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${event.startDate}&enddt=${event.endDate}&body=${description}&location=${location}`;

  // Yahoo Calendar link
  const yahooUrl = `https://calendar.yahoo.com/?v=60&title=${title}&st=${startDate}&et=${endDate}&desc=${description}&in_loc=${location}`;

  return {
    google: googleCalendarUrl,
    outlook: outlookUrl,
    yahoo: yahooUrl,
    // iCal download will be handled by backend route
  };
};

module.exports = {
  generateICalContent,
  generateCalendarLinks
};
