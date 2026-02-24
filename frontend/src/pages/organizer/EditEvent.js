import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';

function EditEvent() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({});
    const [customForm, setCustomForm] = useState([]);
    const [variants, setVariants] = useState([]);

    useEffect(() => {
        fetchEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchEvent = async () => {
        try {
            const data = await axios.get(`/events/${id}`);
            const ev = data.event;
            setEvent(ev);

            const start = ev.startDate ? ev.startDate.slice(0, 16) : '';
            const end = ev.endDate ? ev.endDate.slice(0, 16) : '';
            const deadline = ev.registrationDeadline ? ev.registrationDeadline.slice(0, 16) : '';

            setFormData({
                name: ev.name || '',
                description: ev.description || '',
                eventType: ev.eventType || 'Normal',
                eligibility: ev.eligibility || 'All',
                startDate: start,
                endDate: end,
                registrationDeadline: deadline,
                locationOfEvent: ev.locationOfEvent || '',
                maxParticipants: ev.maxParticipants || '',
                participationFee: ev.participationFee || 0,
                tags: (ev.tags || []).join(', ')
            });

            setCustomForm(ev.customForm || []);
            setVariants(ev.variants || []);
        } catch (err) {
            setError('Failed to load event');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // form builder (draft only)
    const addFormField = () => {
        setCustomForm([...customForm, { fieldName: '', fieldType: 'text', isRequired: false }]);
    };
    const updateFormField = (index, field, value) => {
        const updated = [...customForm];
        updated[index][field] = value;
        setCustomForm(updated);
    };
    const removeFormField = (index) => {
        setCustomForm(customForm.filter((_, i) => i !== index));
    };

    // variant builder (draft only)
    const addVariant = () => {
        setVariants([...variants, { variantName: '', price: 0, stock: 0 }]);
    };
    const updateVariant = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };
    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const payload = {};

            if (event.status === 'draft') {
                Object.assign(payload, {
                    name: formData.name,
                    description: formData.description,
                    eventType: formData.eventType,
                    eligibility: formData.eligibility,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    registrationDeadline: formData.registrationDeadline || undefined,
                    locationOfEvent: formData.locationOfEvent,
                    maxParticipants: Number(formData.maxParticipants),
                    participationFee: Number(formData.participationFee),
                    tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
                });

                if (formData.eventType === 'Normal') {
                    payload.customForm = customForm;
                } else {
                    payload.variants = variants;
                }
            } else if (event.status === 'published') {
                // only allowed fields for published events
                if (formData.description !== undefined) payload.description = formData.description;
                if (formData.registrationDeadline) payload.registrationDeadline = formData.registrationDeadline;
                if (formData.maxParticipants) payload.maxParticipants = Number(formData.maxParticipants);
            }

            await axios.patch(`/events/${id}`, payload);
            setSuccess('Event updated successfully.');
            fetchEvent();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const fieldStyle = { width: '100%', padding: '8px', border: '1px solid black', boxSizing: 'border-box' };
    const disabledFieldStyle = { ...fieldStyle, backgroundColor: '#f5f5f5', color: '#999', border: '1px solid #ccc', cursor: 'not-allowed' };
    const sectionStyle = { marginBottom: '30px', border: '1px solid #ccc', padding: '20px' };

    const isDraft = event?.status === 'draft';
    const isPublished = event?.status === 'published';
    const canEdit = isDraft || isPublished;

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <OrganizerNavbar />
                <div style={{ padding: '20px' }}>Loading event...</div>
            </div>
        );
    }

    if (!event) {
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

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <OrganizerNavbar />
            <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
                <button onClick={() => navigate(`/organizer/events/${id}`)} style={{ marginBottom: '20px', padding: '8px 16px' }}>
                    Back to Event
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0 }}>Edit Event</h1>
                    <span style={{
                        padding: '4px 12px',
                        backgroundColor: isDraft ? '#f0f0f0' : '#d4edda',
                        color: isDraft ? '#666' : '#155724',
                        fontSize: '13px',
                        fontWeight: 'bold'
                    }}>
                        {event.status.toUpperCase()}
                    </span>
                </div>

                {!canEdit && (
                    <div style={{ padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', marginBottom: '20px' }}>
                        Events with status <strong>{event.status}</strong> cannot be edited.
                    </div>
                )}

                {isPublished && (
                    <div style={{ padding: '12px', backgroundColor: '#cce5ff', border: '1px solid #b8daff', marginBottom: '20px', fontSize: '14px' }}>
                        This event is published. Only description, registration deadline, and max participants can be changed.
                        The registration form is locked.
                    </div>
                )}

                {error && (
                    <div style={{ padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', marginBottom: '15px', color: '#721c24' }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ padding: '10px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', marginBottom: '15px', color: '#155724' }}>
                        {success}
                    </div>
                )}

                {canEdit && (
                    <form onSubmit={handleSave}>
                        <div style={sectionStyle}>
                            <h2>Basic Information</h2>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}><strong>Event Name</strong></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!isDraft}
                                    style={isDraft ? fieldStyle : disabledFieldStyle}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}><strong>Description</strong></label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    style={fieldStyle}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}><strong>Event Type</strong></label>
                                    <select
                                        name="eventType"
                                        value={formData.eventType}
                                        onChange={handleChange}
                                        disabled={!isDraft}
                                        style={isDraft ? fieldStyle : disabledFieldStyle}
                                    >
                                        <option value="Normal">Normal Event</option>
                                        <option value="Merchandise">Merchandise</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}><strong>Eligibility</strong></label>
                                    <select
                                        name="eligibility"
                                        value={formData.eligibility}
                                        onChange={handleChange}
                                        disabled={!isDraft}
                                        style={isDraft ? fieldStyle : disabledFieldStyle}
                                    >
                                        <option value="All">All</option>
                                        <option value="IIIT Only">IIIT Only</option>
                                        <option value="Non-IIIT">Non-IIIT</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={sectionStyle}>
                            <h2>Dates & Location</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}><strong>Start Date</strong></label>
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        disabled={!isDraft}
                                        style={isDraft ? fieldStyle : disabledFieldStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}><strong>End Date</strong></label>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        disabled={!isDraft}
                                        style={isDraft ? fieldStyle : disabledFieldStyle}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}><strong>Registration Deadline</strong></label>
                                <input
                                    type="datetime-local"
                                    name="registrationDeadline"
                                    value={formData.registrationDeadline}
                                    onChange={handleChange}
                                    style={fieldStyle}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}><strong>Location</strong></label>
                                <input
                                    type="text"
                                    name="locationOfEvent"
                                    value={formData.locationOfEvent}
                                    onChange={handleChange}
                                    disabled={!isDraft}
                                    style={isDraft ? fieldStyle : disabledFieldStyle}
                                />
                            </div>
                        </div>

                        <div style={sectionStyle}>
                            <h2>Capacity & Fee</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}><strong>Max Participants</strong></label>
                                    <input
                                        type="number"
                                        name="maxParticipants"
                                        value={formData.maxParticipants}
                                        onChange={handleChange}
                                        min="1"
                                        style={fieldStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}><strong>Participation Fee (Rs.)</strong></label>
                                    <input
                                        type="number"
                                        name="participationFee"
                                        value={formData.participationFee}
                                        onChange={handleChange}
                                        min="0"
                                        disabled={!isDraft}
                                        style={isDraft ? fieldStyle : disabledFieldStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tags - draft only */}
                        {isDraft && (
                            <div style={sectionStyle}>
                                <h2>Tags</h2>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    placeholder="e.g. tech, music, workshop (comma separated)"
                                    style={fieldStyle}
                                />
                            </div>
                        )}

                        {/* Registration Form - locked when published */}
                        {formData.eventType === 'Normal' && (
                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h2 style={{ margin: 0 }}>Registration Form Builder</h2>
                                    {isPublished && (
                                        <span style={{ fontSize: '13px', color: '#856404', backgroundColor: '#fff3cd', padding: '3px 10px', border: '1px solid #ffeeba' }}>
                                            Locked - event is published
                                        </span>
                                    )}
                                </div>

                                {customForm.length === 0 && (
                                    <p style={{ color: '#666', fontSize: '14px' }}>No custom fields defined.</p>
                                )}

                                {customForm.map((field, index) => (
                                    <div key={index} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #ddd', backgroundColor: isPublished ? '#f9f9f9' : 'white' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                value={field.fieldName}
                                                onChange={(e) => updateFormField(index, 'fieldName', e.target.value)}
                                                placeholder="Field name"
                                                disabled={isPublished}
                                                style={isPublished ? disabledFieldStyle : fieldStyle}
                                            />
                                            <select
                                                value={field.fieldType}
                                                onChange={(e) => updateFormField(index, 'fieldType', e.target.value)}
                                                disabled={isPublished}
                                                style={isPublished ? disabledFieldStyle : fieldStyle}
                                            >
                                                <option value="text">Text</option>
                                                <option value="textarea">Textarea</option>
                                                <option value="dropdown">Dropdown</option>
                                                <option value="checkbox">Checkbox</option>
                                            </select>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={field.isRequired}
                                                    onChange={(e) => updateFormField(index, 'isRequired', e.target.checked)}
                                                    disabled={isPublished}
                                                />
                                                Required
                                            </label>
                                            {!isPublished && (
                                                <button type="button" onClick={() => removeFormField(index)} style={{ padding: '6px 10px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: 'white' }}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isDraft && (
                                    <button
                                        type="button"
                                        onClick={addFormField}
                                        style={{ padding: '8px 16px', border: '1px solid black', backgroundColor: 'white', cursor: 'pointer', marginTop: '8px' }}
                                    >
                                        + Add Field
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Variants - locked when published */}
                        {formData.eventType === 'Merchandise' && (
                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h2 style={{ margin: 0 }}>Variants</h2>
                                    {isPublished && (
                                        <span style={{ fontSize: '13px', color: '#856404', backgroundColor: '#fff3cd', padding: '3px 10px', border: '1px solid #ffeeba' }}>
                                            Locked - event is published
                                        </span>
                                    )}
                                </div>

                                {variants.map((v, index) => (
                                    <div key={index} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #ddd', backgroundColor: isPublished ? '#f9f9f9' : 'white' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                value={v.variantName}
                                                onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                                                placeholder="Variant name"
                                                disabled={isPublished}
                                                style={isPublished ? disabledFieldStyle : fieldStyle}
                                            />
                                            <input
                                                type="number"
                                                value={v.price}
                                                onChange={(e) => updateVariant(index, 'price', Number(e.target.value))}
                                                placeholder="Price"
                                                min="0"
                                                disabled={isPublished}
                                                style={isPublished ? disabledFieldStyle : fieldStyle}
                                            />
                                            <input
                                                type="number"
                                                value={v.stock}
                                                onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                                                placeholder="Stock"
                                                min="0"
                                                disabled={isPublished}
                                                style={isPublished ? disabledFieldStyle : fieldStyle}
                                            />
                                            {!isPublished && (
                                                <button type="button" onClick={() => removeVariant(index)} style={{ padding: '6px 10px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: 'white' }}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isDraft && (
                                    <button
                                        type="button"
                                        onClick={addVariant}
                                        style={{ padding: '8px 16px', border: '1px solid black', backgroundColor: 'white', cursor: 'pointer', marginTop: '8px' }}
                                    >
                                        + Add Variant
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{ padding: '10px 24px', backgroundColor: saving ? '#ccc' : 'black', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/organizer/events/${id}`)}
                                style={{ padding: '10px 24px', backgroundColor: 'white', border: '1px solid #ccc', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default EditEvent;
