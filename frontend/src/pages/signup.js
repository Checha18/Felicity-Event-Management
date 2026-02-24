import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

function Signup() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        participantType: 'IIIT',
        collegeName: '',
        contactNumber: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.firstName || !formData.lastName || !formData.email ||
            !formData.collegeName || !formData.contactNumber || !formData.password ||
            !formData.confirmPassword) {
            setError('All fields are required');
            return false;
        }

        // FIXME: this regex doesn't catch all invalid emails
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Invalid email format');
            return false;
        }

        if (formData.participantType === 'IIIT') {
            if (!formData.email.endsWith('@iiit.ac.in') &&
                !formData.email.endsWith('@students.iiit.ac.in') &&
                !formData.email.endsWith('@research.iiit.ac.in')) {
                setError('IIIT students must use @iiit.ac.in email');
                return false;
            }
        }

        if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
            setError('Contact number must be exactly 10 digits');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        console.log('Attempting registration for:', formData.email);
        setIsLoading(true);

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                participantType: formData.participantType,
                collegeName: formData.collegeName,
                contactNumber: formData.contactNumber,
                password: formData.password
            });

            // Redirect to onboarding page for preference selection
            navigate('/onboarding');
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh' }}>
            <h1>Felicity - Sign Up</h1>

            <form onSubmit={handleSubmit}>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        style={{ color: 'black', padding: '5px', width: '300px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        style={{ color: 'black', padding: '5px', width: '300px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        style={{ color: 'black', padding: '5px', width: '300px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Participant Type</label>
                    <div>
                        <label style={{ marginRight: '15px' }}>
                            <input
                                type="radio"
                                name="participantType"
                                value="IIIT"
                                checked={formData.participantType === 'IIIT'}
                                onChange={handleChange}
                            />
                            {' '}IIIT Student
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="participantType"
                                value="Non-IIIT"
                                checked={formData.participantType === 'Non-IIIT'}
                                onChange={handleChange}
                            />
                            {' '}Non-IIIT
                        </label>
                    </div>
                </div>

                {formData.participantType === 'Non-IIIT' && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>College/Organization (Optional)</label>
                        <input
                            type="text"
                            name="collegeName"
                            value={formData.collegeName}
                            onChange={handleChange}
                            placeholder="College/Organization Name"
                            style={{ color: 'black', padding: '5px', width: '300px' }}
                        />
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Contact Number</label>
                    <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="10-digit contact number"
                        maxLength="10"
                        style={{ color: 'black', padding: '5px', width: '300px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password (min 6 characters)"
                        style={{ color: 'black', padding: '5px', width: '300px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        style={{ color: 'black', padding: '5px', width: '300px' }}
                    />
                </div>

                <button type="submit" disabled={isLoading} style={{ padding: '8px 16px' }}>
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>

                <div style={{ marginTop: '15px' }}>
                    <p>
                        Already have an account? <a href="/login">Login</a>
                    </p>
                </div>
            </form>
        </div>
    );
}

export default Signup;
