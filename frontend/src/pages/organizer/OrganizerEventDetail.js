import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';
import EventDiscussion from '../../components/EventDiscussion';

function OrganizerEventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('participants');

    // search filter
    const [searchTerm, setSearchTerm] = useState('');

    // payment approvals state
    const [paymentApprovals, setPaymentApprovals] = useState([]);
    const [loadingApprovals, setLoadingApprovals] = useState(false);
    const [proofModal, setProofModal] = useState(null); // image src
    const [rejectModal, setRejectModal] = useState(null); // { id }
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState('');

    // status change state
    const [statusChanging, setStatusChanging] = useState(false);
    const [statusError, setStatusError] = useState('');

    // attendance state
    const [attendanceData, setAttendanceData] = useState({ attended: [], notAttended: [], total: 0, attendedCount: 0 });
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [manualModal, setManualModal] = useState(null); // { id, name }
    const [manualReason, setManualReason] = useState('');

    useEffect(() => {
        fetchEventDetails();
        fetchRegistrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (activeTab === 'approvals') fetchPaymentApprovals();
        if (activeTab === 'attendance') fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const fetchEventDetails = async () => {
        try {
            const data = await axios.get(`/events/${id}`);
            setEvent(data.event);
        } catch (err) {
            setError('Failed to load event details');
            console.error(err);
        }
    };

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const data = await axios.get(`/registrations/event/${id}`);
            setRegistrations(data.registrations);
        } catch (err) {
            console.error('Failed to load registrations:', err);
            setRegistrations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentApprovals = async () => {
        try {
            setLoadingApprovals(true);
            const data = await axios.get(`/registrations/event/${id}/payment-approvals`);
            setPaymentApprovals(data.registrations);
        } catch (err) {
            console.error('Failed to load payment approvals:', err);
        } finally {
            setLoadingApprovals(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            setLoadingAttendance(true);
            const data = await axios.get(`/registrations/event/${id}/attendance`);
            setAttendanceData(data);
        } catch (err) {
            console.error('Failed to load attendance:', err);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleApprove = async (regId) => {
        setActionLoading(regId + '_approve');
        try {
            await axios.patch(`/registrations/${regId}/approve-payment`);
            fetchPaymentApprovals();
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        } finally {
            setActionLoading('');
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setActionLoading(rejectModal.id + '_reject');
        try {
            await axios.patch(`/registrations/${rejectModal.id}/reject-payment`, { reason: rejectReason });
            setRejectModal(null);
            setRejectReason('');
            fetchPaymentApprovals();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        } finally {
            setActionLoading('');
        }
    };

    const handleManualAttendance = async () => {
        if (!manualModal) return;
        setActionLoading('manual_' + manualModal.id);
        try {
            await axios.patch(`/registrations/${manualModal.id}/manual-attendance`, { reason: manualReason });
            setManualModal(null);
            setManualReason('');
            fetchAttendance();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setActionLoading('');
        }
    };

    const handleStatusChange = async (newStatus) => {
        setStatusChanging(true);
        setStatusError('');
        try {
            await axios.patch(`/events/${id}/status`, { status: newStatus });
            await fetchEventDetails();
        } catch (err) {
            setStatusError(err.response?.data?.message || 'Status change failed');
        } finally {
            setStatusChanging(false);
        }
    };

    const handlePublish = async () => {
        setStatusChanging(true);
        setStatusError('');
        try {
            await axios.patch(`/events/${id}/publish`);
            await fetchEventDetails();
        } catch (err) {
            setStatusError(err.response?.data?.message || 'Publish failed');
        } finally {
            setStatusChanging(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // simple CSV export for participants
    const exportToCSV = () => {
        if (registrations.length === 0) {
            alert('No registrations to export');
            return;
        }

        let csv = 'Name,Email,Contact,Type,Registration Date,Status\n';

        registrations.forEach(reg => {
            const participant = reg.participantId;
            csv += `${participant.firstName} ${participant.lastName},${participant.email},${participant.contactNumber},${participant.participantType},${formatDate(reg.registrationDate)},${reg.status}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.name}_registrations.csv`;
        a.click();
    };

    const exportAttendanceCSV = () => {
        const all = [...attendanceData.attended, ...attendanceData.notAttended];
        if (all.length === 0) {
            alert('No attendance data to export');
            return;
        }

        let csv = 'Name,Email,Contact,Type,Status,Attended At,Manual Override\n';
        all.forEach(reg => {
            const p = reg.participantId;
            csv += `${p.firstName} ${p.lastName},${p.email},${p.contactNumber || ''},${p.participantType || ''},${reg.status},${reg.attendedAt ? formatDate(reg.attendedAt) : ''},${reg.manualOverride ? 'Yes' : 'No'}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.name}_attendance.csv`;
        a.click();
    };

    // filter registrations by search
    const filteredRegistrations = registrations.filter(reg => {
        const participant = reg.participantId;
        const searchLower = searchTerm.toLowerCase();
        return (
            participant.firstName.toLowerCase().includes(searchLower) ||
            participant.lastName.toLowerCase().includes(searchLower) ||
            participant.email.toLowerCase().includes(searchLower)
        );
    });

    // calculate analytics
    const totalRevenue = registrations.reduce((sum, reg) => sum + (reg.totalAmount || 0), 0);
    const attendedCount = registrations.filter(reg => reg.status === 'attended').length;

    const paymentStatusColor = {
        pending: '#fff3cd',
        pending_approval: '#cce5ff',
        approved: '#d4edda',
        rejected: '#f8d7da'
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <OrganizerNavbar />
                <div style={{ padding: '20px' }}>Loading...</div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <OrganizerNavbar />
                <div style={{ padding: '20px' }}>
                    <p style={{ color: 'red' }}>{error || 'Event not found'}</p>
                    <button onClick={() => navigate('/organizer/dashboard')}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const tabs = [
        { key: 'participants', label: 'Participants' },
        ...(event.eventType === 'Merchandise' ? [{ key: 'approvals', label: 'Payment Approvals' }] : []),
        { key: 'attendance', label: 'Attendance' }
    ];

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <OrganizerNavbar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/organizer/dashboard')}
                        style={{ padding: '8px 16px' }}
                    >
                        Back to Dashboard
                    </button>
                    {(event && (event.status === 'draft' || event.status === 'published')) && (
                        <button
                            onClick={() => navigate(`/organizer/events/${id}/edit`)}
                            style={{ padding: '8px 16px', backgroundColor: 'black', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            Edit Event
                        </button>
                    )}
                </div>

                {/* Event Overview */}
                <div style={{ marginBottom: '30px' }}>
                    <h1>{event.name}</h1>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '3px',
                            fontSize: '14px'
                        }}>
                            {event.eventType}
                        </span>
                        <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#d4edda',
                            borderRadius: '3px',
                            fontSize: '14px'
                        }}>
                            {event.status}
                        </span>
                        <button
                            onClick={() => navigate(`/organizer/events/${id}/scanner`)}
                            style={{
                                padding: '4px 14px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Open QR Scanner
                        </button>

                        {event.status === 'draft' && (
                            <button
                                onClick={handlePublish}
                                disabled={statusChanging}
                                style={{
                                    padding: '4px 14px',
                                    backgroundColor: statusChanging ? '#ccc' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    cursor: statusChanging ? 'not-allowed' : 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {statusChanging ? '...' : 'Publish'}
                            </button>
                        )}
                        {event.status === 'published' && (
                            <>
                                <button
                                    onClick={() => handleStatusChange('ongoing')}
                                    disabled={statusChanging}
                                    style={{
                                        padding: '4px 14px',
                                        backgroundColor: statusChanging ? '#ccc' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        cursor: statusChanging ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {statusChanging ? '...' : 'Mark as Ongoing'}
                                </button>
                                <button
                                    onClick={() => handleStatusChange('closed')}
                                    disabled={statusChanging}
                                    style={{
                                        padding: '4px 14px',
                                        backgroundColor: statusChanging ? '#ccc' : '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        cursor: statusChanging ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {statusChanging ? '...' : 'Close Registrations'}
                                </button>
                            </>
                        )}
                        {event.status === 'ongoing' && (
                            <button
                                onClick={() => handleStatusChange('closed')}
                                disabled={statusChanging}
                                style={{
                                    padding: '4px 14px',
                                    backgroundColor: statusChanging ? '#ccc' : '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    cursor: statusChanging ? 'not-allowed' : 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {statusChanging ? '...' : 'Mark as Closed'}
                            </button>
                        )}
                    </div>

                    {statusError && (
                        <p style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>{statusError}</p>
                    )}

                    <p>{event.description}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                        <p><strong>Start:</strong> {formatDate(event.startDate)}</p>
                        <p><strong>End:</strong> {formatDate(event.endDate)}</p>
                        <p><strong>Location:</strong> {event.locationOfEvent}</p>
                        <p><strong>Max Participants:</strong> {event.maxParticipants}</p>
                        <p><strong>Fee:</strong> Rs.{event.participationFee || 0}</p>
                        <p><strong>Eligibility:</strong> {event.eligibility}</p>
                    </div>
                </div>

                {/* Analytics */}
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f9f9f9'
                }}>
                    <h2>Analytics</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Total Registrations</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0 0 0' }}>
                                {registrations.length}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Capacity Filled</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0 0 0' }}>
                                {Math.round((registrations.length / event.maxParticipants) * 100)}%
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Total Revenue</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0 0 0' }}>
                                Rs.{totalRevenue}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Attended</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0 0 0' }}>
                                {attendedCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ borderBottom: '2px solid #ddd', marginBottom: '20px', display: 'flex', gap: '0' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderBottom: activeTab === tab.key ? '2px solid black' : '2px solid transparent',
                                marginBottom: '-2px',
                                backgroundColor: 'transparent',
                                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                                cursor: 'pointer',
                                fontSize: '15px'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Participants Tab */}
                {activeTab === 'participants' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2>Registered Participants</h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Search participants..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: '8px',
                                        border: '1px solid #ccc',
                                        width: '250px'
                                    }}
                                />
                                <button
                                    onClick={exportToCSV}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'black',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {filteredRegistrations.length === 0 ? (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                border: '1px solid #ddd',
                                backgroundColor: '#f9f9f9'
                            }}>
                                <p>No registrations yet.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    border: '1px solid #ddd'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Contact</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Type</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Reg. Date</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                                            {event.eventType === 'Merchandise' && (
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Order</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRegistrations.map(reg => {
                                            const participant = reg.participantId;
                                            return (
                                                <tr key={reg._id}>
                                                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                        {participant.firstName} {participant.lastName}
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                        {participant.email}
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                        {participant.contactNumber}
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                        {participant.participantType}
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                        {formatDate(reg.registrationDate)}
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                        {reg.status}
                                                    </td>
                                                    {event.eventType === 'Merchandise' && (
                                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                            {reg.selectedVariant} x{reg.quantity}
                                                            <br />
                                                            <small>Rs.{reg.totalAmount}</small>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Event Discussion Forum */}
                        <EventDiscussion
                            eventId={id}
                            isOrganizer={true}
                            organizerId={event?.organizerId}
                        />
                    </div>
                )}

                {/* Payment Approvals Tab */}
                {activeTab === 'approvals' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2>Payment Approvals</h2>
                            <button
                                onClick={fetchPaymentApprovals}
                                style={{ padding: '8px 16px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: 'white' }}
                            >
                                Refresh
                            </button>
                        </div>

                        {loadingApprovals ? (
                            <p>Loading...</p>
                        ) : paymentApprovals.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                                <p>No merchandise orders yet.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Participant</th>
                                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Variant</th>
                                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Amount</th>
                                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Proof</th>
                                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentApprovals.map(reg => {
                                            const p = reg.participantId;
                                            return (
                                                <tr key={reg._id}>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                        <strong>{p.firstName} {p.lastName}</strong>
                                                        <br />
                                                        <small>{p.email}</small>
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                        {reg.selectedVariant} x{reg.quantity}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                        Rs.{reg.totalAmount}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                        {reg.paymentProof ? (
                                                            <img
                                                                src={reg.paymentProof}
                                                                alt="Payment proof"
                                                                style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #ccc' }}
                                                                onClick={() => setProofModal(reg.paymentProof)}
                                                            />
                                                        ) : (
                                                            <span style={{ color: '#999', fontSize: '13px' }}>Not uploaded</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                        <span style={{
                                                            padding: '3px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            backgroundColor: paymentStatusColor[reg.paymentStatus] || '#eee'
                                                        }}>
                                                            {reg.paymentStatus}
                                                        </span>
                                                        {reg.approvalNotes && (
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666' }}>
                                                                {reg.approvalNotes}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                        {reg.paymentStatus === 'pending_approval' && (
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                <button
                                                                    onClick={() => handleApprove(reg._id)}
                                                                    disabled={actionLoading === reg._id + '_approve'}
                                                                    style={{
                                                                        padding: '5px 12px',
                                                                        backgroundColor: '#28a745',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    {actionLoading === reg._id + '_approve' ? '...' : 'Approve'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectModal({ id: reg._id })}
                                                                    style={{
                                                                        padding: '5px 12px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {reg.paymentStatus === 'approved' && (
                                                            <span style={{ color: '#28a745', fontSize: '12px' }}>Approved</span>
                                                        )}
                                                        {reg.paymentStatus === 'rejected' && (
                                                            <span style={{ color: '#dc3545', fontSize: '12px' }}>Rejected</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Payment Proof Image Modal */}
                        {proofModal && (
                            <div
                                style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.75)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000
                                }}
                                onClick={() => setProofModal(null)}
                            >
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={proofModal}
                                        alt="Payment proof"
                                        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                        onClick={() => setProofModal(null)}
                                        style={{
                                            position: 'absolute', top: '-12px', right: '-12px',
                                            backgroundColor: 'white', border: '1px solid #ccc',
                                            borderRadius: '50%', width: '28px', height: '28px',
                                            cursor: 'pointer', fontSize: '14px', lineHeight: '1'
                                        }}
                                    >
                                        x
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reject Reason Modal */}
                        {rejectModal && (
                            <div
                                style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000
                                }}
                            >
                                <div style={{
                                    backgroundColor: 'white', padding: '24px',
                                    width: '400px', border: '1px solid #ccc'
                                }}>
                                    <h3 style={{ marginTop: 0 }}>Reject Payment Proof</h3>
                                    <p style={{ fontSize: '14px' }}>Provide a reason for rejection (optional):</p>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="e.g. Unclear image, wrong amount..."
                                        rows={3}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', marginBottom: '12px', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleReject}
                                            disabled={actionLoading.includes('_reject')}
                                            style={{
                                                padding: '8px 20px', backgroundColor: '#dc3545',
                                                color: 'white', border: 'none', cursor: 'pointer'
                                            }}
                                        >
                                            {actionLoading.includes('_reject') ? 'Rejecting...' : 'Confirm Reject'}
                                        </button>
                                        <button
                                            onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                            style={{ padding: '8px 20px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: 'white' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2>Attendance ({attendanceData.attendedCount} / {attendanceData.total})</h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={fetchAttendance}
                                    style={{ padding: '8px 16px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: 'white' }}
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={exportAttendanceCSV}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'black',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {loadingAttendance ? (
                            <p>Loading attendance...</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {/* Attended column */}
                                <div>
                                    <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>
                                        Attended ({attendanceData.attended.length})
                                    </h3>
                                    {attendanceData.attended.length === 0 ? (
                                        <p style={{ color: '#666', fontSize: '14px' }}>No one attended yet.</p>
                                    ) : (
                                        attendanceData.attended.map(reg => {
                                            const p = reg.participantId;
                                            return (
                                                <div key={reg._id} style={{
                                                    padding: '10px',
                                                    marginBottom: '8px',
                                                    border: '1px solid #d4edda',
                                                    backgroundColor: '#f0fff4'
                                                }}>
                                                    <strong>{p.firstName} {p.lastName}</strong>
                                                    {reg.manualOverride && (
                                                        <span style={{
                                                            marginLeft: '8px', fontSize: '11px',
                                                            backgroundColor: '#fff3cd', padding: '1px 6px', borderRadius: '3px'
                                                        }}>
                                                            Manual
                                                        </span>
                                                    )}
                                                    <br />
                                                    <small style={{ color: '#666' }}>{p.email}</small>
                                                    <br />
                                                    <small style={{ color: '#555' }}>
                                                        Attended: {formatDate(reg.attendedAt)}
                                                    </small>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Not yet attended column */}
                                <div>
                                    <h3 style={{ borderBottom: '2px solid #dc3545', paddingBottom: '8px' }}>
                                        Not Yet Attended ({attendanceData.notAttended.length})
                                    </h3>
                                    {attendanceData.notAttended.length === 0 ? (
                                        <p style={{ color: '#666', fontSize: '14px' }}>Everyone has attended!</p>
                                    ) : (
                                        attendanceData.notAttended.map(reg => {
                                            const p = reg.participantId;
                                            return (
                                                <div key={reg._id} style={{
                                                    padding: '10px',
                                                    marginBottom: '8px',
                                                    border: '1px solid #f5c6cb',
                                                    backgroundColor: '#fff8f8',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div>
                                                        <strong>{p.firstName} {p.lastName}</strong>
                                                        <br />
                                                        <small style={{ color: '#666' }}>{p.email}</small>
                                                    </div>
                                                    <button
                                                        onClick={() => setManualModal({ id: reg._id, name: `${p.firstName} ${p.lastName}` })}
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #999',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Override
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Manual attendance modal */}
                        {manualModal && (
                            <div
                                style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000
                                }}
                            >
                                <div style={{
                                    backgroundColor: 'white', padding: '24px',
                                    width: '400px', border: '1px solid #ccc'
                                }}>
                                    <h3 style={{ marginTop: 0 }}>Mark Attendance Manually</h3>
                                    <p style={{ fontSize: '14px' }}>
                                        Mark <strong>{manualModal.name}</strong> as attended?
                                    </p>
                                    <textarea
                                        value={manualReason}
                                        onChange={(e) => setManualReason(e.target.value)}
                                        placeholder="Reason (e.g. QR scanner unavailable)"
                                        rows={3}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', marginBottom: '12px', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleManualAttendance}
                                            disabled={!!actionLoading}
                                            style={{
                                                padding: '8px 20px', backgroundColor: 'black',
                                                color: 'white', border: 'none', cursor: 'pointer'
                                            }}
                                        >
                                            {actionLoading ? 'Marking...' : 'Confirm'}
                                        </button>
                                        <button
                                            onClick={() => { setManualModal(null); setManualReason(''); }}
                                            style={{ padding: '8px 20px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: 'white' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrganizerEventDetail;
