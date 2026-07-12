## Development Rules

* Add comments in every file explaining what it does.
* Always `git pull` before pushing your changes.
* Use clear commit messages 
* Follow the existing folder structure.
* Test everything before pushing.
* Work on a separate branch for your feature (example: `teacher-feature`) instead of pushing directly to `main`.   This helps avoid conflicts


# BWF Web Dashboard

Web-based Admin and Warden dashboard for the [Borderless World Foundation](https://www.borderlessworldfoundation.org/) Management System.

This application provides centralized control for managing students, wardens, expenses, activity tracking, analytics, and moderated community content.

Built using Next.js for performance, scalability, and server-side rendering capabilities.

## Overview

`bwf-web-dashboard` is the administrative interface of the Borderless World Foundation digital management system.

It is designed for:

* Admin users with full system control
* Warden users with region-based management access

The dashboard communicates with the `bwf-backend` REST API.

## Core Features

### User Management

* Create and manage student accounts
* Assign wardens to students
* Manage warden roles
* Role-based access enforcement

### Student Tracking

* View student profiles
* Monitor academic performance
* Review activity logs
* Track assigned hostel/region data

### Expense Monitoring

* View individual student expenses
* View institutional expenses
* Filter expenses by category, student, or date
* Summary and analytical views

### Community Moderation

* Review pending student posts
* Approve or reject submissions
* Remove inappropriate content

### Dashboard Analytics

* Student statistics
* Expense summaries
* Activity distribution insights

## Role-Based Access Control

Access is controlled via JWT authentication and backend RBAC middleware.

### Admin

* Full system access
* Manage users
* View all expenses
* Assign wardens
* Access analytics
* Delete content

### Warden

* Manage assigned students
* Approve/reject community posts
* Add student expenses
* Monitor student activities
* View region-based data only

## Technology Stack

* Next.js
* TypeScript
* REST API integration
* JWT Authentication
* Role-based route protection

## Project Structure

```
src/
 ├── app/
 ├── components/
 ├── modules/
 │     ├── students/
 │     ├── expenses/
 │     ├── community/
 │     ├── users/
 ├── services/
 │     └── api.ts
 ├── hooks/
 ├── context/
 ├── middleware/
 └── utils/
```

## Installation

```
npm install
npm run dev
```

For production build:

```
npm run build
npm start
```

## Integration

This dashboard depends on:

* `bwf-backend` for API services
* JWT token-based authentication
* Role-based route guards

Ensure the backend is running before starting the dashboard.

## Security Considerations

* Protect admin routes using middleware
* Store tokens securely
* Validate all role permissions server-side
* Never trust client-side role checks alone
