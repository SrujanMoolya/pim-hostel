# Hostel Management System (HMS) - Admin Dashboard

## Synopsys

The Hostel Management System (HMS) is a modern web-based application designed to streamline and digitize the management of hostel operations for Poornaprajna Institute of Management (PIM). Built for the MCA batch 2024-2026, this system provides an intuitive admin dashboard for managing students, fees, payments, and user accounts, ensuring efficient and secure hostel administration.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Setup Instructions](#setup-instructions)
5. [Usage Guide](#usage-guide)
6. [Work Distribution](#work-distribution)
7. [Developer Credits](#developer-credits)
8. [License](#license)

---

## Project Overview
HMS is a full-featured admin dashboard for hostel management, enabling administrators to:
- Register and manage student records
- Track and record fee payments
- Manage user accounts and access
- Configure system and notification settings
- Ensure data security and backup

The system is designed for ease of use, security, and scalability, leveraging modern web technologies and cloud backend services.

---

## Features
- **Student Management:** Add, edit, and view student details
- **Fee Management:** Record payments, view payment history, and manage dues
- **User Accounts:** Add, delete, and reset passwords for admin accounts
- **Authentication:** Secure login with email and password
- **Settings:** Configure notifications, academic year, currency, and more
- **Data Management:** Backup and export hostel data
- **Responsive UI:** Works seamlessly on desktop and mobile devices

---

## Tech Stack
- **Frontend:** React (Vite, TypeScript)
- **Styling:** Tailwind CSS, Shadcn UI Components
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL, Auth)
- **State Management:** React Query
- **Linting/Formatting:** ESLint, Prettier
- **Build Tool:** Vite

---

## Setup Instructions
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd pim-hostel
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure Supabase:**
   - Update `src/integrations/supabase/client.ts` with your Supabase project URL and anon key.
   - Run migrations in the `supabase/migrations/` folder if needed.
4. **Start the development server:**
   ```sh
   npm run dev
   ```
5. **Access the app:**
   - Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage Guide
- **Login:** Use your admin email and password to log in.
- **Dashboard:** View statistics and quick links.
- **Students:** Add, edit, or remove student records.
- **Fees:** Record payments and view payment history.
- **Settings:**
  - Manage user accounts (add, delete, reset password)
  - Configure system preferences
- **Logout:** Use the sidebar or settings to log out securely.

---

## Work Distribution
- **Srujan Moolya:** Project architecture, authentication, dashboard UI, student management
- **Neelanjan V:** Fees management, payment dialogs, UI forms, testing
- **Vishal Shetty:** Settings/configuration, sidebar/navigation, reusable UI, documentation
- **Aneesh Bhat:** Responsive design, accessibility, performance, deployment
- **Dheeraj Kumar:** Database schema, Supabase backend, API integration, QA

---

## Developer Credits
Developed by MCA batch 2024-2026 for PIM - Poornaprajna Institute of Management

---

## License
This project is for educational purposes and internal use at PIM. Contact the authors for reuse or distribution permissions.
