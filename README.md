# attendance-management-system

Create a .env file in the backend directory:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
Start the backend server:

Bash
npm run dev
2. Frontend Setup
Bash
cd frontend
npm install
Create a .env file in the frontend directory:

Code snippet
VITE_API_URL=http://localhost:5000/api
Start the Vite development server:

Bash
npm run dev
📌 Assumptions Made
During the development of this 48-hour assessment, the following assumptions and technical decisions were made:

1 Image Storage (Base64): To ensure rapid development and deployment within the strict timeframe, webcam selfies are converted to Base64 strings and stored directly in MongoDB. This avoids the overhead of configuring external storage buckets (like AWS S3 or Cloudinary) and ensures the app works immediately upon deployment.

2 Geofencing Coordinates: For the geofencing bonus feature, the "Office Location" is hardcoded to a specific coordinate (e.g., Indore, MP: Lat 22.7196, Lng 75.8577) with a strict 100-meter radius limit. In a production environment, this would be dynamic per user/branch.

3 Single Shift Policy: The system assumes a standard day-shift model. An employee is allowed only one continuous Punch-In and Punch-Out cycle per calendar date.

4 vOvertime Calculation: Overtime is logged separately from standard working hours and must be explicitly requested by the employee and approved by higher authorities.

5 Manager Assignment: It is assumed that an Admin will manually assign Managers to Employees via the Admin Dashboard dropdown to establish the team hierarchy.

##  Architecture & Folder Structure

The application follows a decoupled Client-Server architecture. 

### System Data Flow
`Client (React.js)` ↔️ `RTK Query (Cache & Fetch)` ↔️ `REST API (Express.js)` ↔️ `MongoDB`

### Directory Structure
The project is organized into a clean monorepo to separate frontend and backend concerns:

AttendPro/
│
├── backend/                 # Node.js & Express API environment
│   ├── src/
│   │   ├── config/          # DB connection & Winston logger config
│   │   ├── controllers/     # Core business logic (auth, attendance, overtime)
│   │   ├── middleware/      # JWT verification & RBAC (Role) authorization
│   │   ├── models/          # Mongoose database schemas
│   │   └── routes/          # API endpoint definitions
│   ├── .env                 # Environment variables (DB URI, Secrets)
│   └── server.js            # Express app entry point
│
└── frontend/                # React.js (Vite) Client environment
    ├── src/
    │   ├── components/      # Reusable UI elements (Navbar, Modals, Cards)
    │   ├── pages/           # Role-based Dashboards (Admin, Manager, Employee)
    │   ├── store/           # Redux Toolkit setup (store.js, apiSlice, authSlice)
    │   ├── App.jsx          # React Router & Protected Routes logic
    │   └── index.css        # Global CSS & Tailwind base layers
    ├── tailwind.config.js   # Custom theme, colors, and styling rules
    └── vite.config.js       # Vite bundler configuration

Developed by Arshit Jain