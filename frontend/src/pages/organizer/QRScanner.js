import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';

function QRScanner() {
    const { id: eventId } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [scannerReady, setScannerReady] = useState(false);

    const [manualSearchTerm, setManualSearchTerm] = useState('');
    const [manualResults, setManualResults] = useState([]);
    const [manualLoading, setManualLoading] = useState(false);
    const [manualReason, setManualReason] = useState('');
    const [manualTarget, setManualTarget] = useState(null);
    const [manualSubmitting, setManualSubmitting] = useState(false);

    const scannerRef = useRef(null);

    useEffect(() => {
        fetchEventAndAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    useEffect(() => {
        if (!scannerReady) return;

        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 280, height: 280 }, supportedScanTypes: [] },
            false
        );

        scanner.render(
            (decodedText) => handleScan(decodedText),
            () => { }
        );

        scannerRef.current = scanner;

        return () => {
            scanner.clear().catch(() => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scannerReady]);

    const fetchEventAndAttendance = async () => {
        try {
            const eventData = await axios.get(`/events/${eventId}`);
            setEvent(eventData.event);

            const attData = await axios.get(`/registrations/event/${eventId}/attendance`);
            setAttendanceCount(attData.attendedCount);
            setTotalCount(attData.total);

            setScannerReady(true);
        } catch (err) {
            console.error('Failed to load event:', err);
        }
    };

    const handleScan = async (qrData) => {
        if (scannerRef.current) {
            try { scannerRef.current.pause(true); } catch (e) { }
        }

        try {
            const response = await axios.post('/registrations/scan', { qrData, eventId });
            const entry = {
                result: response.result || 'valid',
                message: response.message,
                participant: response.participant,
                timestamp: new Date()
            };
            setScanResult(entry);
            if (entry.result === 'valid') {
                setAttendanceCount(prev => prev + 1);
                setRecentScans(prev => [entry, ...prev.slice(0, 9)]);
            }
        } catch (err) {
            const data = err.response?.data || {};
            const entry = {
                result: data.result || 'invalid',
                message: data.message || 'Scan failed',
                participant: data.participant,
                timestamp: new Date()
            };
            setScanResult(entry);
            if (data.result === 'duplicate') {
                setRecentScans(prev => [entry, ...prev.slice(0, 9)]);
            }
        }

        setTimeout(() => {
            if (scannerRef.current) {
                try { scannerRef.current.resume(); } catch (e) { }
            }
        }, 2000);
    };

    const handleManualSearch = async () => {
        if (!manualSearchTerm.trim()) return;
        setManualLoading(true);
        try {
            const data = await axios.get(`/registrations/event/${eventId}/attendance`);
            const all = [...data.attended, ...data.notAttended];
            const term = manualSearchTerm.toLowerCase();
            setManualResults(all.filter(reg => {
                const p = reg.participantId;
                return (
                    p.firstName.toLowerCase().includes(term) ||
                    p.lastName.toLowerCase().includes(term) ||
                    p.email.toLowerCase().includes(term)
                );
            }));
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setManualLoading(false);
        }
    };

    const handleManualAttendance = async () => {
        if (!manualTarget) return;
        setManualSubmitting(true);
        try {
            await axios.patch(`/registrations/${manualTarget.id}/manual-attendance`, {
                reason: manualReason || 'Manual override from QR Scanner page'
            });
            setAttendanceCount(prev => prev + 1);
            setManualTarget(null);
            setManualReason('');
            setManualSearchTerm('');
            setManualResults([]);
            fetchEventAndAttendance();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setManualSubmitting(false);
        }
    };

    const getScanResultStyle = (result) => {
        if (result === 'valid') return { bg: '#d4edda', border: '#c3e6cb', text: '#155724', label: 'Valid' };
        if (result === 'duplicate') return { bg: '#fff3cd', border: '#ffeeba', text: '#856404', label: 'Already scanned' };
        return { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', label: 'Invalid' };
    };

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <OrganizerNavbar />
            <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate(`/organizer/events/${eventId}`)}
                    style={{ padding: '8px 16px', marginBottom: '20px' }}
                >
                    Back to Event
                </button>

                <h1>QR Scanner</h1>
                {event && (
                    <p style={{ color: '#555', marginTop: '-10px', marginBottom: '20px' }}>
                        {event.name}
                    </p>
                )}

                <div style={{
                    padding: '16px 24px',
                    backgroundColor: '#f0f8ff',
                    border: '1px solid #b8daff',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>Scanned / Total</p>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
                            {attendanceCount} / {totalCount}
                        </p>
                    </div>
                    {totalCount > 0 && (
                        <div style={{ flex: 1 }}>
                            <div style={{ height: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.round((attendanceCount / totalCount) * 100)}%`,
                                    backgroundColor: '#28a745',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#555' }}>
                                {Math.round((attendanceCount / totalCount) * 100)}% attendance
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                        <h3>Camera Scanner</h3>
                        {scannerReady ? (
                            <div id="qr-reader" style={{ border: '1px solid #ddd' }} />
                        ) : (
                            <p>Loading scanner...</p>
                        )}

                        {scanResult && (() => {
                            const s = getScanResultStyle(scanResult.result);
                            return (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '14px',
                                    backgroundColor: s.bg,
                                    border: `1px solid ${s.border}`,
                                    color: s.text
                                }}>
                                    <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '15px' }}>
                                        {s.label}: {scanResult.message}
                                    </p>
                                    {scanResult.participant && (
                                        <>
                                            <p style={{ margin: '3px 0', fontSize: '14px' }}>
                                                <strong>Name:</strong> {scanResult.participant.name}
                                            </p>
                                            <p style={{ margin: '3px 0', fontSize: '14px' }}>
                                                <strong>Email:</strong> {scanResult.participant.email}
                                            </p>
                                            {scanResult.participant.variant && (
                                                <p style={{ margin: '3px 0', fontSize: '14px' }}>
                                                    <strong>Variant:</strong> {scanResult.participant.variant}
                                                </p>
                                            )}
                                            {scanResult.result === 'duplicate' && scanResult.participant.attendedAt && (
                                                <p style={{ margin: '3px 0', fontSize: '13px' }}>
                                                    <strong>First scanned:</strong>{' '}
                                                    {new Date(scanResult.participant.attendedAt).toLocaleString('en-IN')}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <div>
                        <h3>Recent Scans</h3>
                        {recentScans.length === 0 ? (
                            <p style={{ color: '#999', fontSize: '14px' }}>No scans yet.</p>
                        ) : (
                            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #ddd' }}>
                                {recentScans.map((s, i) => {
                                    const style = getScanResultStyle(s.result);
                                    return (
                                        <div key={i} style={{
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: i === 0 ? style.bg : 'white'
                                        }}>
                                            <span style={{ fontSize: '11px', color: style.text, fontWeight: 'bold', marginRight: '6px' }}>
                                                [{style.label}]
                                            </span>
                                            <strong style={{ fontSize: '13px' }}>
                                                {s.participant?.name || 'Unknown'}
                                            </strong>
                                            <br />
                                            <small style={{ color: '#666' }}>
                                                {s.timestamp.toLocaleTimeString('en-IN')}
                                            </small>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <h3 style={{ marginTop: '24px' }}>Manual Attendance</h3>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={manualSearchTerm}
                                onChange={(e) => setManualSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                style={{ flex: 1, padding: '8px', border: '1px solid #ccc' }}
                            />
                            <button
                                onClick={handleManualSearch}
                                disabled={manualLoading}
                                style={{
                                    padding: '8px 14px',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {manualLoading ? '...' : 'Search'}
                            </button>
                        </div>

                        {manualResults.length > 0 && (
                            <div style={{ border: '1px solid #ddd', maxHeight: '200px', overflowY: 'auto' }}>
                                {manualResults.map(reg => {
                                    const p = reg.participantId;
                                    const attended = reg.status === 'attended';
                                    return (
                                        <div key={reg._id} style={{
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #eee',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: attended ? '#f0fff4' : 'white'
                                        }}>
                                            <div>
                                                <strong style={{ fontSize: '13px' }}>{p.firstName} {p.lastName}</strong>
                                                <br />
                                                <small style={{ color: '#666' }}>{p.email}</small>
                                            </div>
                                            {attended ? (
                                                <span style={{ fontSize: '12px', color: '#28a745' }}>Attended</span>
                                            ) : (
                                                <button
                                                    onClick={() => setManualTarget({ id: reg._id, name: `${p.firstName} ${p.lastName}` })}
                                                    style={{
                                                        padding: '4px 10px', fontSize: '12px',
                                                        backgroundColor: 'black', color: 'white',
                                                        border: 'none', cursor: 'pointer'
                                                    }}
                                                >
                                                    Mark
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {manualTarget && (
                            <div style={{
                                marginTop: '10px', padding: '14px',
                                border: '1px solid #ccc', backgroundColor: '#f9f9f9'
                            }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                    Mark <strong>{manualTarget.name}</strong> as attended?
                                </p>
                                <input
                                    type="text"
                                    placeholder="Reason (optional)"
                                    value={manualReason}
                                    onChange={(e) => setManualReason(e.target.value)}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #ccc', marginBottom: '8px', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleManualAttendance}
                                        disabled={manualSubmitting}
                                        style={{
                                            padding: '6px 14px', backgroundColor: '#28a745',
                                            color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px'
                                        }}
                                    >
                                        {manualSubmitting ? 'Marking...' : 'Confirm'}
                                    </button>
                                    <button
                                        onClick={() => setManualTarget(null)}
                                        style={{
                                            padding: '6px 14px', backgroundColor: 'white',
                                            border: '1px solid #ccc', cursor: 'pointer', fontSize: '13px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QRScanner;
