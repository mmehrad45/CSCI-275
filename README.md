# ClinicFlow

ClinicFlow is a web-based application designed to streamline appointment scheduling and daily operations for clinics.

The platform provides role-specific interfaces for clinic managers, receptionists, and doctors, helping reduce scheduling errors, improve workflow visibility, and centralize clinic operations.

This project was developed as part of CSCI-275 (Software Engineering) using Agile methodology.

---

## Live Demo

App: https://csci-275-six.vercel.app

---

## Problem Statement

Many clinics rely on manual or outdated booking systems, which can result in:

- Double bookings and scheduling conflicts
- High administrative workload
- Limited visibility into clinic operations
- Poor patient experience

ClinicFlow addresses these issues by offering a centralized, role-based scheduling and workflow system.

---

## Key Features

- Role-based authentication (Manager, Receptionist, Doctor)
- Appointment scheduling with conflict awareness
- Doctor availability and calendar views
- Patient record management (create, edit, view)
- Manager dashboard with operational overview
- Task assignment between staff roles
- Integrated chatbot for workflow guidance
- Responsive user interface for desktop and mobile

---

## Tech Stack

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:
- Node.js
- Express
- REST APIs
- JWT authentication

Database:
- PostgreSQL
- Prisma ORM

Deployment:
- Vercel
- GitHub

---

## System Overview

ClinicFlow follows a standard three-layer architecture:

1. Frontend (Next.js)  
   Handles user interaction, role-based dashboards, and chatbot UI.

2. Backend (Node.js / Express)  
   Manages authentication, business logic, and API endpoints.

3. Database (PostgreSQL)  
   Stores users, patients, appointments, availability, and tasks.

---

## User Roles

Manager:
- View clinic-wide appointments
- Manage staff accounts
- Assign and track tasks
- Monitor clinic operations

Receptionist:
- Register patients
- Schedule and manage appointments
- View doctor availability
- Handle assigned tasks

Doctor:
- View personal schedule
- Access patient visit details
- Update appointment status

---

## Chatbot Assistant

ClinicFlow includes a lightweight chatbot embedded in the UI.

The chatbot:
- Answers common “how-to” questions
- Guides users through tasks like booking or cancelling appointments
- Uses predefined responses (no live data access)
- Improves usability without introducing system risk

---

## Running the Project Locally

1. Clone the repository:

2. Install dependencies:

3. Create a `.env.local` file and add required variables:

4. Start the development server:

Open http://localhost:3000 in your browser.

---

## My Role

I was the project originator and primary developer for ClinicFlow.

My responsibilities included:
- Conceptualizing the ClinicFlow platform and defining the problem scope
- Designing the system architecture and core workflows
- Selecting the technology stack and defining dependencies
- Implementing the full application logic across frontend and backend
- Designing database models and API endpoints
- Integrating authentication, role-based access, and scheduling logic
- Deploying the application and maintaining the codebase

---

## Contributors

- Mazda Mehrad (Product Owner, Sprint Master, Developer)
- Jay Patel (Developer)
- Frederic Tchedou (Documentation & Unit Testing)
- Gagandeep Singh (Documentation)
- Joel Victor Ssemambo (Documentation & Unit Testing)

---

## Notes

This project was built for educational purposes while studying CSCI275 with Johnny Zhang at Columbia College Vancouver.
Additional security and validation would be required for real-world deployment.
