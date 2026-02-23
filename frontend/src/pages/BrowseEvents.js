import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/authContext';

function BrowseEvents() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // filters
    const [searchTerm, setSearchTerm] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('All');
    const [eligibilityFilter, setEligibilityFilter] = useState('All');
    const [showTrending, setShowTrending] = useState(false);
    const [showFollowedOnly, setShowFollowedOnly] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchEvents();
    }, [showTrending, showFollowedOnly, startDate, endDate, searchTerm, eventTypeFilter, eligibilityFilter]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (searchTerm) params.append('search', searchTerm);
            if (eventTypeFilter !== 'All') params.append('eventType', eventTypeFilter);
            if (eligibilityFilter !== 'All') params.append('eligibility', eligibilityFilter);
            if (showTrending) params.append('trending', 'true');
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            if (showFollowedOnly && user && user.followedClubs && user.followedClubs.length > 0) {
                // HACK: joining with comma, will break if club ID has comma (shouldn't happen)
                params.append('followedClubs', user.followedClubs.join(','));
            }

            // personalized ordering based on user preferences
            if (user) {
                if (user.interests && user.interests.length > 0) {
                    params.append('userInterests', user.interests.join(','));
                }
                if (user.followedClubs && user.followedClubs.length > 0 && !showFollowedOnly) {
                    params.append('userFollowedClubs', user.followedClubs.join(','));
                }
            }

            console.log('Fetching events with params:', params.toString());
            const response = await axios.get(`/events?${params.toString()}`);
            setEvents(response.events || []);
            setFilteredEvents(response.events || []);
            setError('');
        } catch (err) {
            setError('Failed to load events');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh' }}>
                <p>Loading events...</p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ padding: '20px' }}>
                <h1>Browse Events</h1>

                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                {/* Filters */}
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
                    <h3 style={{ marginTop: 0 }}>Filters</h3>

                    {/* Search */}
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ color: 'black', padding: '8px', width: '300px', border: '1px solid #ccc' }}
                        />
                    </div>

                    {/* Toggle Filters */}
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showTrending}
                                onChange={(e) => setShowTrending(e.target.checked)}
                                style={{ marginRight: '5px' }}
                            />
                            <span>Trending (Top 5/24h)</span>
                        </label>

                        {user && user.followedClubs && user.followedClubs.length > 0 && (
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={showFollowedOnly}
                                    onChange={(e) => setShowFollowedOnly(e.target.checked)}
                                    style={{ marginRight: '5px' }}
                                />
                                <span>⭐ Followed Clubs Only</span>
                            </label>
                        )}
                    </div>

                    {/* Dropdowns */}
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ marginRight: '10px' }}>Event Type:</label>
                            <select
                                value={eventTypeFilter}
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                                style={{ color: 'black', padding: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="All">All</option>
                                <option value="Normal">Normal</option>
                                <option value="Merchandise">Merchandise</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ marginRight: '10px' }}>Eligibility:</label>
                            <select
                                value={eligibilityFilter}
                                onChange={(e) => setEligibilityFilter(e.target.value)}
                                style={{ color: 'black', padding: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="All">All</option>
                                <option value="IIIT Only">IIIT Only</option>
                                <option value="Non-IIIT">Non-IIIT</option>
                                <option value="All">Everyone</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div>
                            <label style={{ marginRight: '10px' }}>Start Date:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ color: 'black', padding: '5px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ marginRight: '10px' }}>End Date:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ color: 'black', padding: '5px', border: '1px solid #ccc' }}
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                style={{ padding: '5px 10px', cursor: 'pointer' }}
                            >
                                Clear Dates
                            </button>
                        )}
                    </div>
                </div>

                {/* Events count */}
                <p style={{ marginBottom: '15px' }}>
                    Showing {filteredEvents.length} of {events.length} events
                </p>

                {/* Events list */}
                {filteredEvents.length === 0 ? (
                    <p>No events found</p>
                ) : (
                    <div>
                        {filteredEvents.map(event => (
                            <div
                                key={event._id}
                                onClick={() => navigate(`/events/${event._id}`)}
                                style={{
                                    border: '1px solid #ccc',
                                    padding: '15px',
                                    marginBottom: '15px',
                                    cursor: 'pointer',
                                    backgroundColor: '#f9f9f9'
                                }}
                            >
                                <h3 style={{ marginTop: 0 }}>{event.name}</h3>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Type:</strong> {event.eventType} | <strong>Eligibility:</strong> {event.eligibility}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Date:</strong> {formatDate(event.startDate)} to {formatDate(event.endDate)}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Location:</strong> {event.locationOfEvent}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Fee:</strong> Rs.{event.participationFee || 0}
                                </p>
                                {event.organizerId && (
                                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                                        By: {event.organizerId.organizerName}
                                    </p>
                                )}
                                <p style={{ margin: '10px 0 0 0', color: '#555' }}>
                                    {event.description.substring(0, 150)}...
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BrowseEvents;
