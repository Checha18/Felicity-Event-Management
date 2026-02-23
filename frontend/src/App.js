import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import Login from './pages/login';
import Signup from './pages/signup';
import Onboarding from './pages/Onboarding';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import MyEvents from './pages/MyEvents';
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';

// organizer pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import OrganizerEventDetail from './pages/organizer/OrganizerEventDetail';
import OrganizerProfile from './pages/organizer/OrganizerProfile';
import OrganizerMyEvents from './pages/organizer/MyEvents';
import RequestPasswordReset from './pages/organizer/RequestPasswordReset';
import QRScanner from './pages/organizer/QRScanner';

// admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import ManagePasswordResets from './pages/admin/ManagePasswordResets';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Participant routes */}
          <Route path="/dashboard" element={<MyEvents />} />
          <Route path="/events" element={<BrowseEvents />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />

          {/* Organizer routes */}
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/create-event" element={<CreateEvent />} />
          <Route path="/organizer/my-events" element={<OrganizerMyEvents />} />
          <Route path="/organizer/events/:id" element={<OrganizerEventDetail />} />
          <Route path="/organizer/events/:id/edit" element={<EditEvent />} />
          <Route path="/organizer/events/:id/scanner" element={<QRScanner />} />
          <Route path="/organizer/profile" element={<OrganizerProfile />} />
          <Route path="/organizer/password-reset" element={<RequestPasswordReset />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-organizers" element={<ManageOrganizers />} />
          <Route path="/admin/password-resets" element={<ManagePasswordResets />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;