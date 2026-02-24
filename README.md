# Felicity Event Management System

A web-based event management platform for our college fest, Felicity, supporting event registration, merchandise payments, attendance tracking, real-time discussions, and organizer workflows.

---

## Tech Stack

### Backend

| Library / Module | Justification |
|---|---|
| express | Web framework for Node.js used to define all API routes and middleware. |
| mongoose | ODM for MongoDB that provides schema-based data modeling. |
| jsonwebtoken | Used to sign and verify JWTs for stateless authentication. |
| bcrypt / bcryptjs | Used to hash and compare passwords securely. |
| nodemailer | Used to send transactional emails such as password reset links. |
| socket.io | Enables real-time bidirectional communication for the discussion forum. |
| multer | Handles multipart form-data for file uploads such as payment proof images. |
| qrcode | Generates QR codes for event attendance tracking. |
| cors | Configures Cross-Origin Resource Sharing to allow frontend-backend communication. |
| dotenv | Loads environment variables from the `.env` file at runtime. |
| axios | Used to make HTTP requests from the backend where needed. |
| nodemon | Development utility that auto-restarts the server on file changes. |
| jest | Testing framework used to write and run backend unit and integration tests. |
| supertest | Used alongside Jest to make HTTP assertions against the Express app in tests. |

### Frontend

| Library / Module | Justification |
|---|---|
| react | Core UI library used to build all frontend components. |
| react-dom | Renders the React component tree into the browser DOM. |
| react-router-dom | Handles client-side routing and navigation between pages. |
| axios | Used to make HTTP requests to the backend REST API. |
| socket.io-client | Connects to the backend Socket.IO server for real-time forum updates. |
| html5-qrcode | Provides QR code scanning functionality via the device camera. |
| lucide-react | Icon library used for UI icons throughout the application. |
| tailwindcss | Utility-first CSS framework used for styling components. |
| @testing-library/react | Used to write component-level tests for the React frontend. |
| @testing-library/jest-dom | Provides custom DOM matchers for use with Jest in frontend tests. |
| web-vitals | Used to measure and report core web performance metrics. |

---

## Advanced Features

### Tier A

- **Merchandise Payment Approval Workflow**: Participants can upload payment proof for merchandise orders. Organizers can review, approve, or reject each submission through a dedicated dashboard.
- **QR Scanner and Attendance Tracking**: A unique QR code is generated per registration. Organizers can scan QR codes using the device camera to mark attendance in real time.

### Tier B

- **Real-Time Discussion Forum**: Each event has a live discussion forum powered by Socket.IO, allowing participants and organizers to post and receive messages in real time without page refresh.
- **Organizer Password Reset Workflow**: Organizers can request a password reset. An admin reviews and approves the request, after which a reset link is emailed to the organizer.

### Tier C

- **Add to Calendar Integration**: Registered participants can add an event directly to their Google Calendar via a generated calendar link on the event details page.

---

## Setup and Installation

### Prerequisites

- Node.js (v18 or above)
- MongoDB (local instance or MongoDB Atlas URI)
- npm

### Backend

```bash
cd backend
npm install
```

Start the backend server:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Start the frontend server:

```bash
npm start
```

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:5000` by default.

### Seeding the Admin User

To create the initial admin account, run the following from the `backend` directory:

```bash
npm run seed:admin
```

