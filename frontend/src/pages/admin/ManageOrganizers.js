import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import AdminNavbar from '../../components/AdminNavbar';

function ManageOrganizers() {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // create form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState(null);

    const [formData, setFormData] = useState({
        organizerName: '',
        category: 'Club',
        description: '',
        contactNumber: ''
    });

    // search
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            setLoading(true);
            const data = await axios.get('/admin/organizers');
            setOrganizers(data.organizers);
            setError('');
        } catch (err) {
            setError('Failed to load organizers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateOrganizer = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreating(true);

        try {
            const response = await axios.post('/admin/organizers', formData);

            // show credentials
            setCreatedCredentials(response.credentials);

            // reset form
            setFormData({
                organizerName: '',
                category: 'Club',
                description: '',
                contactNumber: ''
            });

            // refresh list
            fetchOrganizers();

            setShowCreateForm(false);
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create organizer');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteOrganizer = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`/admin/organizers/${id}`);
            fetchOrganizers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete organizer');
        }
    };

    const filteredOrganizers = organizers.filter(org => {
        const searchLower = searchTerm.toLowerCase();
        return (
            org.organizerName.toLowerCase().includes(searchLower) ||
            org.category.toLowerCase().includes(searchLower) ||
            org.contactEmail.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <AdminNavbar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1>Manage Organizers</h1>

                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                {/* Credentials Display */}
                {createdCredentials && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#d4edda',
                        border: '2px solid #28a745',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0' }}>✓ Organizer Created Successfully!</h3>
                        <p style={{ margin: '10px 0' }}>
                            <strong>Email:</strong> {createdCredentials.email}
                        </p>
                        <p style={{ margin: '10px 0' }}>
                            <strong>Password:</strong> {createdCredentials.password}
                        </p>
                        <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#666' }}>
                            ⚠️ Save these credentials! The password will not be shown again.
                        </p>
                        <button
                            onClick={() => setCreatedCredentials(null)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            OK
                        </button>
                    </div>
                )}

                {/* Action Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <input
                        type="text"
                        placeholder="Search organizers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '10px',
                            border: '1px solid #ccc',
                            width: '300px'
                        }}
                    />

                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: showCreateForm ? '#ccc' : 'black',
                            color: showCreateForm ? 'black' : 'white',
                            border: showCreateForm ? '1px solid black' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {showCreateForm ? 'Cancel' : '+ Create New Organizer'}
                    </button>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <div style={{
                        padding: '20px',
                        border: '2px solid black',
                        marginBottom: '30px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <h2>Create New Organizer</h2>

                        {createError && (
                            <div style={{
                                padding: '10px',
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                marginBottom: '15px',
                                color: '#721c24'
                            }}>
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreateOrganizer}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                    <strong>Organizer Name *</strong>
                                </label>
                                <input
                                    type="text"
                                    name="organizerName"
                                    value={formData.organizerName}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Photography Club"
                                    style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                                />
                                <small style={{ color: '#666' }}>Email will be auto-generated from this name</small>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                    <strong>Category *</strong>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                                >
                                    <option value="Club">Club</option>
                                    <option value="Council">Council</option>
                                    <option value="Fest Team">Fest Team</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                    <strong>Description *</strong>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    placeholder="Brief description of the organizer..."
                                    style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                    <strong>Contact Number</strong>
                                </label>
                                <input
                                    type="tel"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                    style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: 'none',
                                    cursor: creating ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {creating ? 'Creating...' : 'Create Organizer'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Organizers Table */}
                <div>
                    <h2>All Organizers ({filteredOrganizers.length})</h2>

                    {loading ? (
                        <p>Loading organizers...</p>
                    ) : filteredOrganizers.length === 0 ? (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <p>No organizers found.</p>
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
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Contact</th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Events</th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrganizers.map(org => (
                                        <tr key={org._id}>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                {org.organizerName}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                {org.category}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                {org.contactEmail}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                {org.contactNumber || 'N/A'}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                {org.eventCount || 0}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: org.isApproved ? '#d4edda' : '#f8d7da',
                                                    color: org.isApproved ? '#155724' : '#721c24',
                                                    borderRadius: '3px',
                                                    fontSize: '12px'
                                                }}>
                                                    {org.isApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                <button
                                                    onClick={() => handleDeleteOrganizer(org._id, org.organizerName)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Delete
                                                </button>
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

export default ManageOrganizers;
