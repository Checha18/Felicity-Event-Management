import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';

function CreateEvent() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        eventType: 'Normal',
        eligibility: 'All',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        locationOfEvent: '',
        maxParticipants: '',
        participationFee: 0
    });

    // for normal events
    const [customForm, setCustomForm] = useState([]);

    // for merchandise events
    const [variants, setVariants] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Form builder functions
    const addFormField = () => {
        setCustomForm([...customForm, {
            fieldName: '',
            fieldType: 'text',
            isRequired: false,
            options: []
        }]);
    };

    const updateFormField = (index, field, value) => {
        const updated = [...customForm];
        updated[index][field] = value;
        setCustomForm(updated);
    };

    const removeFormField = (index) => {
        setCustomForm(customForm.filter((_, i) => i !== index));
    };

    // Variant builder functions
    const addVariant = () => {
        setVariants([...variants, {
            variantName: '',
            price: 0,
            stock: 0
        }]);
    };

    const updateVariant = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const eventData = { ...formData };

            // add custom form or variants based on type
            if (formData.eventType === 'Normal') {
                eventData.customForm = customForm;
            } else if (formData.eventType === 'Merchandise') {
                if (variants.length === 0) {
                    setError('Please add at least one variant for merchandise events');
                    setLoading(false);
                    return;
                }
                eventData.variants = variants;
            }

            console.log('Creating event:', eventData); // debug log
            const response = await axios.post('/events', eventData);
            console.log('Event created:', response);

            // redirect to dashboard
            navigate('/organizer/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <OrganizerNavbar />
            <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
                <h1>Create New Event</h1>

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        marginBottom: '15px',
                        color: '#721c24'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px' }}>
                        <h2>Basic Information</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Event Name *</strong>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
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
                                rows={4}
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Event Type *</strong>
                            </label>
                            <select
                                name="eventType"
                                value={formData.eventType}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            >
                                <option value="Normal">Normal Event</option>
                                <option value="Merchandise">Merchandise</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Eligibility *</strong>
                            </label>
                            <select
                                name="eligibility"
                                value={formData.eligibility}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            >
                                <option value="All">All</option>
                                <option value="IIIT Only">IIIT Only</option>
                                <option value="Non-IIIT">Non-IIIT</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates & Location */}
                    <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px' }}>
                        <h2>Dates & Location</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Start Date & Time *</strong>
                            </label>
                            <input
                                type="datetime-local"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>End Date & Time *</strong>
                            </label>
                            <input
                                type="datetime-local"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Registration Deadline</strong>
                            </label>
                            <input
                                type="datetime-local"
                                name="registrationDeadline"
                                value={formData.registrationDeadline}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Location *</strong>
                            </label>
                            <input
                                type="text"
                                name="locationOfEvent"
                                value={formData.locationOfEvent}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>
                    </div>

                    {/* Capacity & Fee */}
                    <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px' }}>
                        <h2>Capacity & Fee</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Max Participants *</strong>
                            </label>
                            <input
                                type="number"
                                name="maxParticipants"
                                value={formData.maxParticipants}
                                onChange={handleChange}
                                required
                                min="1"
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Participation Fee (Rs.)</strong>
                            </label>
                            <input
                                type="number"
                                name="participationFee"
                                value={formData.participationFee}
                                onChange={handleChange}
                                min="0"
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>
                    </div>

                    {/* Custom Form Builder - Normal Events */}
                    {formData.eventType === 'Normal' && (
                        <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px' }}>
                            <h2>Registration Form Builder</h2>
                            <p style={{ color: '#666', marginBottom: '15px' }}>
                                Create custom fields for participant registration
                            </p>

                            {customForm.map((field, index) => (
                                <div key={index} style={{
                                    marginBottom: '15px',
                                    padding: '15px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            Field Name
                                        </label>
                                        <input
                                            type="text"
                                            value={field.fieldName}
                                            onChange={(e) => updateFormField(index, 'fieldName', e.target.value)}
                                            placeholder="e.g., Team Name"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            Field Type
                                        </label>
                                        <select
                                            value={field.fieldType}
                                            onChange={(e) => updateFormField(index, 'fieldType', e.target.value)}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                        >
                                            <option value="text">Text</option>
                                            <option value="textarea">Textarea</option>
                                            <option value="dropdown">Dropdown</option>
                                            <option value="checkbox">Checkbox</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={field.isRequired}
                                                onChange={(e) => updateFormField(index, 'isRequired', e.target.checked)}
                                                style={{ marginRight: '5px' }}
                                            />
                                            Required field
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeFormField(index)}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Remove Field
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addFormField}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                + Add Form Field
                            </button>
                        </div>
                    )}

                    {/* Variant Builder - Merchandise Events */}
                    {formData.eventType === 'Merchandise' && (
                        <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px' }}>
                            <h2>Product Variants</h2>
                            <p style={{ color: '#666', marginBottom: '15px' }}>
                                Add product variants (e.g., T-Shirt sizes, colors)
                            </p>

                            {variants.map((variant, index) => (
                                <div key={index} style={{
                                    marginBottom: '15px',
                                    padding: '15px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            Variant Name
                                        </label>
                                        <input
                                            type="text"
                                            value={variant.variantName}
                                            onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                                            placeholder="e.g., T-Shirt (M)"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            Price (Rs.)
                                        </label>
                                        <input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            Stock
                                        </label>
                                        <input
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                            min="0"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Remove Variant
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addVariant}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                + Add Variant
                            </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div style={{ marginTop: '30px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Event (Draft)'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/organizer/dashboard')}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#ccc',
                                border: '1px solid #999',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEvent;
