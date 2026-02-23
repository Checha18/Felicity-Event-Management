import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';

function RequestPasswordReset() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const response = await axios.get('/password-reset/my-requests');
      setMyRequests(response.data.requests);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/password-reset/request', { reason });
      setSuccess('Password reset request submitted successfully. Admin will review your request.');
      setReason('');
      // Refresh requests list
      fetchMyRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <OrganizerNavbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => navigate('/organizer/profile')}
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
          ← Back to Profile
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
          Password Reset Request
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          If you've forgotten your password, submit a request and our admin will review and approve it.
        </p>

        {/* Request Form */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            Submit New Request
          </h2>

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

          {success && (
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

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Reason for Password Reset *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for why you need a password reset (minimum 10 characters)"
                rows="5"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                required
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                {reason.length}/500 characters (minimum 10 required)
              </small>
            </div>

            <button
              type="submit"
              disabled={loading || reason.trim().length < 10}
              style={{
                backgroundColor: loading || reason.trim().length < 10 ? '#ccc' : 'black',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '5px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || reason.trim().length < 10 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* My Requests */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            My Requests History
          </h2>

          {fetchingRequests ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              Loading requests...
            </p>
          ) : myRequests.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No password reset requests found. Submit your first request above.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      Requested At
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      Reason
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      Admin Notes
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      Processed At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((request) => (
                    <tr key={request._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {formatDate(request.requestedAt)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', maxWidth: '300px' }}>
                        {request.reason}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {getStatusBadge(request.status)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                        {request.adminNotes || '—'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {request.processedAt ? formatDate(request.processedAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <strong>ℹ️ Note:</strong> Once your request is approved by an admin, you will receive a new password.
          The admin will contact you through your registered email to share the new credentials.
        </div>
      </div>
    </div>
  );
}

export default RequestPasswordReset;
