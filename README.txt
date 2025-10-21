CSCI-275 PROJECT – Sprint 2
---------------------------

This folder contains the complete backend and frontend setup for the ClinicFlow web application.

Created and updated by: [Your Name]
Branch: sprint-2


=================================
HOW TO RUN THE PROJECT LOCALLY
=================================

1. Open your terminal (or Git Bash).
2. Navigate to the project folder:
   cd C:\projects\CSCI-275

3. Switch to the sprint-2 branch (if not already):
   git checkout sprint-2


===========================
BACKEND SETUP (Express API)
===========================

1. Navigate to backend folder:
   cd backend

2. Install dependencies:
   npm install

3. Create a file named .env inside the backend folder with the following content:
   ---------------------------------
   PORT=4000
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=your_own_password_for_your_MySQL
   DB_NAME=clinicflow_db
   JWT_SECRET=change_me_to_a_long_random_string
   CORS_ORIGIN=http://localhost:3000
   ---------------------------------

4. Make sure your MySQL server is running locally.

5. Create the database (only once):
   Run this command in MySQL:
   CREATE DATABASE clinicflow_db;

6. Start the backend:
   npm run dev

7. The backend will run on:
   http://127.0.0.1:4000


============================
FRONTEND SETUP (Next.js App)
============================

1. Open a new terminal window.

2. Navigate to the frontend folder:
   cd C:\projects\CSCI-275\frontend

3. Install dependencies:
   npm install

4. The .env.local file is already included and contains:
   ---------------------------------
   NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
   ---------------------------------

5. Start the frontend:
   npm run dev

6. Open the browser and go to:
   http://localhost:3000


=====================
PROJECT STRUCTURE
=====================
CSCI-275/
├── backend/
│   ├── src/
│   ├── routes/
│   ├── services/
│   ├── app.js
│   ├── config.js
│   └── .env  (NOT uploaded to GitHub)
│
└── frontend/
    ├── src/app/
    ├── src/context/
    ├── src/components/
    ├── .env.local
    └── next.config.mjs


=====================
NOTES
=====================
- Backend handles authentication, patients, users, and appointments.
- Frontend uses Next.js with TypeScript and Tailwind CSS.
- The frontend communicates with the backend using the API URL in .env.local.
- Make sure both backend and frontend are running at the same time.
- If you get a 401, 402, or CORS error, check:
  - The backend is running on port 4000
  - The frontend .env.local file has the correct API URL
  - The backend .env file has the correct CORS_ORIGIN value
- Do NOT push the backend .env file to GitHub (it contains your DB password and JWT secret).
- All new work for Sprint 2 is inside this branch. Do not merge into main without review.


=====================
COMMAND SUMMARY
=====================
# Run backend
cd backend
npm install
npm run dev

# Run frontend
cd frontend
npm install
npm run dev


=====================
END OF FILE
=====================
