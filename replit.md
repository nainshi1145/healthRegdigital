# Digital Health Registration System

## Overview

This is a web-based digital health registration system that allows users to register their health information through a clean, modern interface. The application captures essential health data including personal details, blood group, and Aadhar number, with provisions for biometric fingerprint scanning. The system uses a black-themed UI with green accent colors, creating a professional healthcare application aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Static HTML/CSS/JavaScript**: The frontend is built using vanilla web technologies without any framework dependencies
- **Responsive Design**: Single-page application with mobile-first responsive design principles
- **Form-based Interface**: Clean registration form with client-side validation for health data collection
- **Black Theme Design**: Professional dark theme with green (#00ff88) accent colors for healthcare branding

### Backend Architecture
- **Node.js/Express Server**: RESTful API server handling registration requests and serving static files
- **MVC Pattern**: Simple controller-based routing with direct database interaction
- **Middleware Stack**: CORS enabled for cross-origin requests, body-parser for form data handling
- **Static File Serving**: Express serves frontend assets directly from the application directory

### Data Storage
- **SQLite Database**: Lightweight, file-based database (`health_registration.db`) for user registration data
- **User Schema**: Stores personal information (name, DOB, city, email), health data (blood group), identity (Aadhar number), and biometric status
- **Auto-incrementing IDs**: Primary key with automatic timestamp creation
- **Data Validation**: Email uniqueness constraints and required field validation

### Security Considerations
- **Unique Email Constraint**: Prevents duplicate registrations
- **Input Validation**: Required field validation on both client and server side
- **Biometric Ready**: Fingerprint scanning flag prepared for future biometric integration

## External Dependencies

### Runtime Dependencies
- **Express (v5.1.0)**: Web application framework for Node.js
- **SQLite3 (v5.1.7)**: Database driver for SQLite integration
- **CORS (v2.8.5)**: Cross-Origin Resource Sharing middleware
- **Body-Parser (v2.2.0)**: HTTP request body parsing middleware

### Development Stack
- **Node.js**: JavaScript runtime environment
- **NPM**: Package management and build scripts
- **No Frontend Framework**: Vanilla JavaScript implementation for lightweight performance

### Database
- **SQLite**: Self-contained, serverless database engine requiring no additional setup or configuration

### Future Integration Points
- **Biometric Services**: Architecture prepared for fingerprint scanning integration
- **Healthcare APIs**: Extensible design for connecting to health information systems
- **Government ID Verification**: Aadhar number collection suggests integration with Indian identity verification services