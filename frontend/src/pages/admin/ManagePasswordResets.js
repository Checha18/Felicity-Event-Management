import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import AdminNavbar from '../../components/AdminNavbar';

function ManagePasswordResets() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCredentials, setShowCredentials] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParam = filter === 'all' ? '' : `?status=${filter}`;
      const response = await axios.get(`/password-reset/admin/requests${queryParam}`);
      setRequests(response.data.requests);
    } catch (err) {
      setError('Failed to fetch password reset requests');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/password-reset/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this password reset request? A new password will be generated.')) {
      return;
    }

    setProcessing(requestId);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(`/password-reset/admin/approve/${requestId}`, {
        adminNotes: adminNotes || 'Approved by admin'
      });

      setSuccess('Password reset approved successfully!');
      setShowCredentials(response.data.credentials);
      setAdminNotes('');
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    const notes = window.prompt('Please provide a reason for rejection (optional):');
    if (notes === null) return; // User cancelled

    setProcessing(requestId);
    setError('');
    setSuccess('');

    try {
      await axios.patch(`/password-reset/admin/reject/${requestId}`, {
        adminNotes: notes || 'Request rejected by admin'
      });

      setSuccess('Password reset request rejected.');
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { backgroundColor: '#FFA500', color: 'white' },
      approved: { backgroundColor: '#28a745', color: 'white' },
      rejected: { backgroundColor: '#dc3545', color: 'white' }
    };

    return (
      <span style={{
        ...styles[status],
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', color: 'black' }}>
      <AdminNavbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => navigate('/admin/dashboard')}
          style={{
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid #ddd',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
          Password Reset Requests
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Review and manage organizer password reset requests
        </p>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {[
            { label: 'Total Requests', value: stats.total, color: '#007bff' },
            { label: 'Pending', value: stats.pending, color: '#FFA500' },
            { label: 'Approved', value: stats.approved, color: '#28a745' },
            { label: 'Rejected', value: stats.rejected, color: '#dc3545' }
          ].map((stat, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderTop: `4px solid ${stat.color}`
            }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                {stat.label}
              </h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Generated Credentials Display */}
        {showCredentials && (
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>
              ✅ Password Reset Approved!
            </h3>
            <p style={{ marginBottom: '10px' }}>
              <strong>New credentials have been generated. Please share these with the organizer:</strong>
            </p>
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '5px',
              fontFamily: 'monospace',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '5px 0' }}>
                <strong>Email:</strong> {showCredentials.email}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>New Password:</strong> {showCredentials.newPassword}
              </p>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              ⚠️ <strong>Important:</strong> Copy these credentials now. They will not be shown again.
            </p>
            <button
              onClick={() => setShowCredentials(null)}
              style={{
                backgroundColor: '#155724',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              OK, I've Saved the Credentials
            </button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            {error}
          </div>
        )}

        {success && !showCredentials && (
          <div style={{
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            padding: '12px',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            {success}
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {['pending', 'approved', 'rejected', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  backgroundColor: filter === status ? 'black' : 'white',
                  color: filter === status ? 'white' : 'black',
                  border: '1px solid black',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}
              >
                {status} ({status === 'all' ? stats.total : stats[status]})
              </button>
            ))}
          </div>

          {/* Requests Table */}
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading requests...
            </p>
          ) : requests.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No {filter !== 'all' ? filter : ''} requests found.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      Organizer
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      Reason
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      Requested At
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div>
                          <strong>{request.organizerId?.organizerName}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {request.organizerId?.contactEmail}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {request.organizerId?.category}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', maxWidth: '300px' }}>
                        {request.reason}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {getStatusBadge(request.status)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {formatDate(request.requestedAt)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {request.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprove(request._id)}
                              disabled={processing === request._id}
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: processing === request._id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                opacity: processing === request._id ? 0.6 : 1
                              }}
                            >
                              {processing === request._id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              disabled={processing === request._id}
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: processing === request._id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                opacity: processing === request._id ? 0.6 : 1
                              }}
                            >
                              {processing === request._id ? '...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            <div>Processed by: {request.processedBy?.email || 'N/A'}</div>
                            <div>{formatDate(request.processedAt)}</div>
                            {request.adminNotes && (
                              <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                                Note: {request.adminNotes}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ManagePasswordResets;
