import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Navbar from '../components/Navbar';

function MyEvents() {
    const navigate = useNavigate();

    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, normal, merchandise, completed, cancelled

    // payment proof upload state per registration
    const [proofFiles, setProofFiles] = useState({});
    const [uploadingProof, setUploadingProof] = useState({});
    const [proofErrors, setProofErrors] = useState({});
    const [, setProofSuccess] = useState({});

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            const data = await axios.get('/registrations/my-events');
            setRegistrations(data.registrations || []);
            setError('');
        } catch (err) {
            setError('Failed to load your events');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (registrationId) => {
        if (!window.confirm('Are you sure you want to cancel this registration?')) {
            return;
        }

        try {
            await axios.delete(`/registrations/${registrationId}`);
            // refresh the list
            fetchMyEvents();
        } catch (err) {
            alert('Failed to cancel registration: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleProofUpload = async (registrationId) => {
        const file = proofFiles[registrationId];
        if (!file) {
            setProofErrors(prev => ({ ...prev, [registrationId]: 'Please select an image' }));
            return;
        }
        setProofErrors(prev => ({ ...prev, [registrationId]: '' }));
        setUploadingProof(prev => ({ ...prev, [registrationId]: true }));
        try {
            const formData = new FormData();
            formData.append('paymentProof', file);
            await axios.post(`/registrations/${registrationId}/payment-proof`, formData, {
                headers: { 'Content-Type': undefined }
            });
            setProofSuccess(prev => ({ ...prev, [registrationId]: true }));
            fetchMyEvents(); // refresh to get updated status
        } catch (err) {
            setProofErrors(prev => ({
                ...prev,
                [registrationId]: err.response?.data?.message || 'Upload failed'
            }));
        } finally {
            setUploadingProof(prev => ({ ...prev, [registrationId]: false }));
        }
    };

    const isUpcoming = (event) => {
        return new Date(event.startDate) > new Date();
    };

    const filteredRegistrations = registrations.filter(reg => {
        if (!reg.eventId) return false;

        const event = reg.eventId;

        switch (filter) {
            case 'normal':
                return event.eventType === 'Normal';
            case 'merchandise':
                return event.eventType === 'Merchandise';
            case 'completed':
                // Events that are in the past
                return !isUpcoming(event) && reg.status !== 'cancelled';
            case 'cancelled':
                return reg.status === 'cancelled';
            case 'all':
            default:
                return true;
        }
    });

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <Navbar />
                <div style={{ padding: '20px' }}>
                    <p>Loading your events...</p>
                </div>
            </div>
        );
    }

    const paymentStatusColor = {
        not_required: '#e9ecef',
        pending: '#fff3cd',
        pending_approval: '#cce5ff',
        approved: '#d4edda',
        rejected: '#f8d7da'
    };

    const paymentStatusLabel = {
        not_required: 'No Payment Required',
        pending: 'Awaiting Payment Proof',
        pending_approval: 'Under Review',
        approved: 'Payment Approved',
        rejected: 'Payment Rejected'
    };

    const FilterButton = ({ label, value }) => (
        <button
            onClick={() => setFilter(value)}
            style={{
                padding: '8px 16px',
                marginRight: '10px',
                marginBottom: '10px',
                backgroundColor: filter === value ? 'black' : 'white',
                color: filter === value ? 'white' : 'black',
                border: '1px solid black',
                cursor: 'pointer'
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1>My Events</h1>
                    <div>
                        <button onClick={() => navigate('/events')} style={{ padding: '10px 20px', backgroundColor: 'black', color: 'white', border: 'none', cursor: 'pointer' }}>
                            Browse Events
                        </button>
                    </div>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                {/* Upcoming registrations */}
                {(() => {
                    const upcoming = registrations.filter(
                        reg => reg.eventId && isUpcoming(reg.eventId) && reg.status !== 'cancelled'
                    );
                    if (upcoming.length === 0) return null;
                    return (
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ marginBottom: '15px' }}>Upcoming Events</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                                {upcoming.map(reg => {
                                    const ev = reg.eventId;
                                    return (
                                        <div
                                            key={reg._id}
                                            style={{
                                                border: '1px solid #ccc',
                                                padding: '16px',
                                                backgroundColor: '#f9f9f9',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/events/${ev._id}`)}
                                        >
                                            <div style={{ marginBottom: '8px' }}>
                                                <span style={{
                                                    backgroundColor: ev.eventType === 'Normal' ? '#e3f2fd' : '#fff3e0',
                                                    padding: '2px 8px',
                                                    fontSize: '11px',
                                                    marginRight: '6px'
                                                }}>
                                                    {ev.eventType}
                                                </span>
                                                <span style={{
                                                    backgroundColor: '#c8e6c9',
                                                    padding: '2px 8px',
                                                    fontSize: '11px'
                                                }}>
                                                    {reg.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{ev.name}</h3>
                                            <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                                                <strong>Organizer:</strong> {ev.organizerId?.organizerName || '-'}
                                            </p>
                                            <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                                                <strong>Date:</strong> {formatDate(ev.startDate)}
                                            </p>
                                            <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                                                <strong>Location:</strong> {ev.locationOfEvent}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Filter buttons */}
                <div style={{ marginBottom: '20px', flexWrap: 'wrap', display: 'flex' }}>
                    <FilterButton label={`All (${registrations.length})`} value="all" />
                    <FilterButton label="Normal" value="normal" />
                    <FilterButton label="Merchandise" value="merchandise" />
                    <FilterButton label="Completed" value="completed" />
                    <FilterButton label="Cancelled" value="cancelled" />
                </div>

                {filteredRegistrations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', border: '1px solid #eee' }}>
                        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                            No {filter === 'all' ? '' : filter} events found.
                        </p>
                    </div>
                ) : (
                    <div>
                        {filteredRegistrations.map(registration => {
                            const event = registration.eventId;
                            if (!event) return null;

                            return (
                                <div
                                    key={registration._id}
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '20px',
                                        marginBottom: '15px',
                                        backgroundColor: registration.status === 'cancelled' ? '#ffebee' : '#f9f9f9',
                                        opacity: registration.status === 'cancelled' ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '300px' }}>
                                            <div style={{ marginBottom: '10px' }}>
                                                <span style={{
                                                    backgroundColor: event.eventType === 'Normal' ? '#e3f2fd' : '#fff3e0',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    marginRight: '10px'
                                                }}>
                                                    {event.eventType}
                                                </span>
                                                <span style={{
                                                    backgroundColor: registration.status === 'cancelled' ? '#ffcdd2' : '#c8e6c9',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}>
                                                    {registration.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <h3
                                                style={{
                                                    marginTop: 0,
                                                    marginBottom: '10px',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline'
                                                }}
                                                onClick={() => navigate(`/events/${event._id}`)}
                                            >
                                                {event.name}
                                            </h3>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                                <div>
                                                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                                                        <strong>Ticket ID:</strong>
                                                        <br />
                                                        <span
                                                            onClick={() => navigate(`/events/${event._id}`)}
                                                            style={{ fontFamily: 'monospace', fontSize: '13px', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
                                                        >
                                                            {registration._id}
                                                        </span>
                                                    </p>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Organizer:</strong><br />
                                                        {event.organizerId?.organizerName || '-'}
                                                    </p>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Date:</strong><br />
                                                        {formatDate(event.startDate)}
                                                    </p>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Location:</strong><br />
                                                        {event.locationOfEvent}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Registered on:</strong><br />
                                                        {formatDate(registration.registrationDate)}
                                                    </p>

                                                    {registration.registrationType === 'Merchandise' && (
                                                        <p style={{ margin: '5px 0' }}>
                                                            <strong>Order:</strong><br />
                                                            {registration.selectedVariant} × {registration.quantity} = Rs.{registration.totalAmount}
                                                        </p>
                                                    )}

                                                    {/* Payment status badge */}
                                                    {registration.registrationType === 'Merchandise' && (
                                                        <p style={{ margin: '5px 0' }}>
                                                            <strong>Payment:</strong>{' '}
                                                            <span style={{
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                backgroundColor: paymentStatusColor[registration.paymentStatus] || '#eee'
                                                            }}>
                                                                {paymentStatusLabel[registration.paymentStatus] || registration.paymentStatus}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {registration.paymentStatus === 'rejected' && registration.approvalNotes && (
                                                        <p style={{ margin: '5px 0', color: '#721c24', fontSize: '13px' }}>
                                                            <strong>Rejection reason:</strong> {registration.approvalNotes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* payment proof upload for pending/rejected orders */}
                                            {registration.registrationType === 'Merchandise' &&
                                                ['pending', 'rejected'].includes(registration.paymentStatus) && (
                                                    <div style={{
                                                        marginTop: '15px',
                                                        padding: '15px',
                                                        backgroundColor: '#fffbf0',
                                                        border: '1px solid #f0ad4e'
                                                    }}>
                                                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
                                                            Upload Payment Proof
                                                        </p>
                                                        {proofErrors[registration._id] && (
                                                            <p style={{ color: 'red', fontSize: '13px', margin: '0 0 6px 0' }}>
                                                                {proofErrors[registration._id]}
                                                            </p>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setProofFiles(prev => ({
                                                                ...prev,
                                                                [registration._id]: e.target.files[0]
                                                            }))}
                                                            style={{ display: 'block', marginBottom: '8px' }}
                                                        />
                                                        <button
                                                            onClick={() => handleProofUpload(registration._id)}
                                                            disabled={uploadingProof[registration._id]}
                                                            style={{
                                                                padding: '6px 16px',
                                                                backgroundColor: uploadingProof[registration._id] ? '#ccc' : '#f0ad4e',
                                                                border: 'none',
                                                                cursor: uploadingProof[registration._id] ? 'not-allowed' : 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {uploadingProof[registration._id] ? 'Uploading...' : 'Submit Proof'}
                                                        </button>
                                                    </div>
                                                )}

                                            {/* QR Code Display */}
                                            {registration.qrCode && registration.status !== 'cancelled' && (
                                                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'white', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center' }}>
                                                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px' }}>
                                                        Your Ticket QR Code
                                                    </p>
                                                    <img
                                                        src={registration.qrCode}
                                                        alt="Ticket QR Code"
                                                        style={{ maxWidth: '200px', width: '100%', height: 'auto' }}
                                                    />
                                                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
                                                        Present this QR code at the event venue
                                                    </p>
                                                </div>
                                            )}

                                            {/* Add to Calendar Button */}
                                            {registration.status !== 'cancelled' && (
                                                <div style={{ marginTop: '15px' }}>
                                                    <a
                                                        href={`${axios.defaults.baseURL}/registrations/${registration._id}/calendar`}
                                                        download={`${event.name.replace(/[^a-z0-9]/gi, '_')}_ticket.ics`}
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '10px 20px',
                                                            backgroundColor: 'black',
                                                            color: 'white',
                                                            border: 'none',
                                                            textDecoration: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        Add to Calendar (with Ticket Details)
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '10px' }}>
                                            {registration.status === 'registered' && isUpcoming(event) && (
                                                <button
                                                    onClick={() => handleCancelRegistration(registration._id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: 'white',
                                                        border: '1px solid red',
                                                        color: 'red',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel Registration
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyEvents;
