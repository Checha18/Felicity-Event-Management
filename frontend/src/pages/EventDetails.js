import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Navbar from '../components/Navbar';
import EventDiscussion from '../components/EventDiscussion';

function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // registration state
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [registrationError, setRegistrationError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // form data
    const [customFormResponses, setCustomFormResponses] = useState({});
    const [selectedVariant, setSelectedVariant] = useState('');
    const [quantity, setQuantity] = useState(1);

    // payment proof upload state
    const [registrationId, setRegistrationId] = useState(null);
    const [paymentProofFile, setPaymentProofFile] = useState(null);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);
    const [proofError, setProofError] = useState('');

    useEffect(() => {
        fetchEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const data = await axios.get(`/events/${id}`);
            setEvent(data.event);
            setError('');

            // initialize custom form responses
            if (data.event.customForm) {
                const initialResponses = {};
                data.event.customForm.forEach(field => {
                    initialResponses[field.fieldName] = '';
                });
                setCustomFormResponses(initialResponses);
            }
        } catch (err) {
            setError('Failed to load event details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setRegistrationError('');
        setRegistering(true);

        try {
            const registrationData = { eventId: id };

            if (event.eventType === 'Normal') {
                // validate required fields
                const missingFields = event.customForm
                    .filter(field => field.required && !customFormResponses[field.fieldName])
                    .map(field => field.fieldName);

                if (missingFields.length > 0) {
                    setRegistrationError(`Please fill in: ${missingFields.join(', ')}`);
                    setRegistering(false);
                    return;
                }

                registrationData.customFormResponses = Object.entries(customFormResponses).map(
                    ([fieldName, response]) => ({ fieldName, response })
                );
            } else if (event.eventType === 'Merchandise') {
                if (!selectedVariant) {
                    setRegistrationError('Please select a variant');
                    setRegistering(false);
                    return;
                }
                registrationData.selectedVariant = selectedVariant;
                registrationData.quantity = quantity;
            }

            const result = await axios.post('/registrations', registrationData);
            setRegistrationSuccess(true);
            setShowRegistrationForm(false);
            if (event.eventType === 'Merchandise' && result.registration) {
                setRegistrationId(result.registration._id);
            }
        } catch (err) {
            setRegistrationError(err.response?.data?.message || 'Registration failed');
        } finally {
            setRegistering(false);
        }
    };

    const handleProofUpload = async () => {
        if (!paymentProofFile) {
            setProofError('Please select an image file');
            return;
        }
        setProofError('');
        setUploadingProof(true);
        try {
            const formData = new FormData();
            formData.append('paymentProof', paymentProofFile);
            await axios.post(`/registrations/${registrationId}/payment-proof`, formData, {
                headers: { 'Content-Type': undefined }
            });
            setProofUploaded(true);
        } catch (err) {
            setProofError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingProof(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh' }}>
                <p>Loading event details...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh' }}>
                <p style={{ color: 'red' }}>{error || 'Event not found'}</p>
                <button onClick={() => navigate('/events')} style={{ padding: '8px 16px', marginTop: '10px' }}>
                    Back to Events
                </button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ padding: '20px' }}>
                <button onClick={() => navigate('/events')} style={{ padding: '8px 16px', marginBottom: '20px' }}>
                    ← Back to Events
                </button>

                {registrationSuccess && (
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        marginBottom: '20px',
                        color: '#155724'
                    }}>
                        ✓ Registration successful! View your events in My Events dashboard.
                    </div>
                )}

                {/* payment proof upload, shown after merchandise registration */}
                {registrationSuccess && event.eventType === 'Merchandise' && registrationId && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '20px',
                        border: '2px solid #f0ad4e',
                        backgroundColor: '#fffbf0'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Upload Payment Proof</h3>
                        {proofUploaded ? (
                            <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                                Payment proof submitted. Your order is under review.
                            </p>
                        ) : (
                            <>
                                <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                                    Please upload a screenshot or photo of your payment receipt to complete your merchandise order.
                                </p>
                                {proofError && (
                                    <p style={{ color: 'red', fontSize: '14px' }}>{proofError}</p>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPaymentProofFile(e.target.files[0])}
                                    style={{ marginBottom: '10px', display: 'block' }}
                                />
                                <button
                                    onClick={handleProofUpload}
                                    disabled={uploadingProof || !paymentProofFile}
                                    style={{
                                        padding: '8px 20px',
                                        backgroundColor: uploadingProof ? '#ccc' : '#f0ad4e',
                                        border: 'none',
                                        cursor: uploadingProof ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {uploadingProof ? 'Uploading...' : 'Submit Payment Proof'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                <div style={{ maxWidth: '800px' }}>
                    <h1>{event.name}</h1>

                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>
                        <p style={{ margin: '5px 0' }}><strong>Type:</strong> {event.eventType}</p>
                        <p style={{ margin: '5px 0' }}><strong>Eligibility:</strong> {event.eligibility}</p>
                        <p style={{ margin: '5px 0' }}><strong>Status:</strong> {event.status}</p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3>Description</h3>
                        <p>{event.description}</p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3>Event Details</h3>
                        <p style={{ margin: '5px 0' }}><strong>Start:</strong> {formatDate(event.startDate)}</p>
                        <p style={{ margin: '5px 0' }}><strong>End:</strong> {formatDate(event.endDate)}</p>
                        <p style={{ margin: '5px 0' }}><strong>Location:</strong> {event.locationOfEvent}</p>
                        <p style={{ margin: '5px 0' }}><strong>Max Participants:</strong> {event.maxParticipants}</p>
                        <p style={{ margin: '5px 0' }}><strong>Participation Fee:</strong> Rs.{event.participationFee || 0}</p>
                        {event.registrationDeadline && (
                            <p style={{ margin: '5px 0' }}><strong>Registration Deadline:</strong> {formatDate(event.registrationDeadline)}</p>
                        )}
                    </div>

                    {event.organizerId && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3>Organized By</h3>
                            <p style={{ margin: '5px 0' }}><strong>Name:</strong> {event.organizerId.organizerName}</p>
                            <p style={{ margin: '5px 0' }}><strong>Category:</strong> {event.organizerId.category}</p>
                            <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {event.organizerId.contactEmail}</p>
                        </div>
                    )}

                    {event.eventType === 'Merchandise' && event.variants && event.variants.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3>Available Variants</h3>
                            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                                {event.variants.map((variant, index) => (
                                    <div key={index} style={{
                                        marginBottom: '10px',
                                        padding: '10px',
                                        backgroundColor: 'white',
                                        border: '1px solid #ddd'
                                    }}>
                                        <p style={{ margin: '5px 0' }}><strong>{variant.variantName}</strong></p>
                                        <p style={{ margin: '5px 0' }}>Price: Rs.{variant.price}</p>
                                        <p style={{ margin: '5px 0' }}>Stock: {variant.stock} available</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add to Calendar Section */}
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>
                        <h3 style={{ marginTop: 0 }}>Add to Calendar</h3>
                        <p style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>
                            Save this event to your calendar
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <a
                                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${new Date(event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.locationOfEvent || 'IIIT Hyderabad')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'white',
                                    color: 'black',
                                    border: '1px solid black',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Google Calendar
                            </a>
                            <a
                                href={`https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.name)}&startdt=${event.startDate}&enddt=${event.endDate}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.locationOfEvent || 'IIIT Hyderabad')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'white',
                                    color: 'black',
                                    border: '1px solid black',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Outlook
                            </a>
                            <a
                                href={`${axios.defaults.baseURL}/events/${event._id}/calendar`}
                                download={`${event.name.replace(/[^a-z0-9]/gi, '_')}.ics`}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: '1px solid black',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Download .ics (Apple Calendar, etc.)
                            </a>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        {!showRegistrationForm && !registrationSuccess && (
                            <button
                                onClick={() => setShowRegistrationForm(true)}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Register for Event
                            </button>
                        )}

                        {showRegistrationForm && (
                            <div style={{
                                marginTop: '20px',
                                padding: '20px',
                                border: '2px solid black',
                                backgroundColor: '#f9f9f9'
                            }}>
                                <h3>Registration Form</h3>

                                {registrationError && (
                                    <div style={{
                                        padding: '10px',
                                        backgroundColor: '#f8d7da',
                                        border: '1px solid #f5c6cb',
                                        marginBottom: '15px',
                                        color: '#721c24'
                                    }}>
                                        {registrationError}
                                    </div>
                                )}

                                {event.eventType === 'Normal' && event.customForm && event.customForm.length > 0 && (
                                    <div>
                                        {event.customForm.map((field, index) => (
                                            <div key={index} style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                                    <strong>{field.fieldName}</strong>
                                                    {field.required && <span style={{ color: 'red' }}> *</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customFormResponses[field.fieldName] || ''}
                                                    onChange={(e) => setCustomFormResponses({
                                                        ...customFormResponses,
                                                        [field.fieldName]: e.target.value
                                                    })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ccc'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {event.eventType === 'Merchandise' && (
                                    <div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                                <strong>Select Variant *</strong>
                                            </label>
                                            <select
                                                value={selectedVariant}
                                                onChange={(e) => setSelectedVariant(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ccc'
                                                }}
                                            >
                                                <option value="">-- Select --</option>
                                                {event.variants.map((variant, index) => (
                                                    <option key={index} value={variant.variantName}>
                                                        {variant.variantName} - Rs.{variant.price} ({variant.stock} available)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                                <strong>Quantity</strong>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                                style={{
                                                    width: '100px',
                                                    padding: '8px',
                                                    border: '1px solid #ccc'
                                                }}
                                            />
                                        </div>

                                        {selectedVariant && (
                                            <p style={{ marginBottom: '15px' }}>
                                                <strong>Total: Rs.{
                                                    event.variants.find(v => v.variantName === selectedVariant)?.price * quantity || 0
                                                }</strong>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div style={{ marginTop: '20px' }}>
                                    <button
                                        onClick={handleRegister}
                                        disabled={registering}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: 'black',
                                            color: 'white',
                                            border: 'none',
                                            marginRight: '10px',
                                            cursor: registering ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {registering ? 'Registering...' : 'Submit Registration'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowRegistrationForm(false);
                                            setRegistrationError('');
                                        }}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#ccc',
                                            border: '1px solid #999',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Event Discussion Forum */}
                    <EventDiscussion
                        eventId={id}
                        isOrganizer={false}
                        organizerId={event?.organizerId?._id}
                    />
                </div>
            </div>
        </div>
    );
}

export default EventDetails;
