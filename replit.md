# Digital Health Registration System - Enhanced

## Overview

This is an advanced web-based digital health registration system designed for healthcare workers, featuring comprehensive health data management, biometric authentication, and multi-language support. The application provides a complete workflow from registration to health ID generation, detailed health profiling, and secure login capabilities. Built with a professional black-themed UI and green accent colors (#00ff88) for healthcare branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Vanilla Web Technologies**: Built with HTML5, CSS3, and modern JavaScript ES6+
- **Responsive Design**: Mobile-first design with comprehensive responsive breakpoints
- **Multi-Language Support**: Complete i18n implementation for English, Hindi (हिंदी), and Malayalam (മലയാളം)
- **Voice Input Integration**: Web Speech API implementation with Hindi and English recognition
- **Progressive UI Flow**: Step-by-step guided registration process with Health ID generation
- **Accessibility Features**: High contrast mode support and reduced motion preferences

### Backend Architecture
- **Node.js/Express Server**: RESTful API with comprehensive endpoint coverage
- **Health ID Generation**: Unique ID system (HLTH-YYYYMMDD-XXXXX format) for worker identification
- **Multi-step Registration**: Basic info → Health ID → Health Profile → Biometric verification
- **Authentication System**: Health ID-based login with session management
- **Middleware Stack**: CORS, body-parser, static file serving, and error handling

### Data Storage
- **SQLite Database**: Two-table architecture for user data and health profiles
- **Users Table**: Basic information with unique Health ID and email constraints
- **Health Profiles Table**: Detailed health data linked via Health ID foreign key
- **Data Schema**: Comprehensive user profiling including chronic diseases, allergies, emergency contacts, and medications
- **Audit Trail**: Automatic timestamp creation and fingerprint scanning status tracking

### Security Considerations
- **Unique Health ID System**: Collision-resistant ID generation with date-based prefixes
- **Email Uniqueness**: Prevents duplicate registrations with clear error messaging
- **Input Validation**: Client-side and server-side validation with real-time feedback
- **Crypto-JS Integration**: Prepared for Aadhar number encryption and sensitive data protection
- **Biometric Authentication**: Fingerprint scanning integration for identity verification

### User Experience Features
- **Voice Input**: Microphone buttons on all text fields with language-specific recognition
- **Language Switching**: Real-time UI language updates without page reload
- **Health ID Display**: Prominent display of generated Health ID with save instructions
- **Worker Dashboard**: Comprehensive profile view with health information and history
- **Navigation System**: Bottom navigation bar for easy switching between registration and login
- **Message System**: Real-time feedback with success/error notifications

## External Dependencies

### Runtime Dependencies
- **Express (v5.1.0)**: Web application framework
- **SQLite3 (v5.1.7)**: Database engine and driver
- **CORS (v2.8.5)**: Cross-origin resource sharing
- **Body-Parser (v2.2.0)**: HTTP request parsing
- **Crypto-JS**: Encryption library for sensitive data protection

### Frontend Technologies
- **Web Speech API**: For voice input functionality
- **CSS Grid & Flexbox**: Advanced layout management
- **CSS Animations**: Smooth transitions and user feedback
- **Responsive Images**: Optimized display across devices

### Database Schema
- **users**: id, health_id (unique), name, date_of_birth, city, email (unique), blood_group, aadhar_number, fingerprint_scanned, created_at
- **health_profiles**: id, health_id (FK), chronic_diseases, allergies, emergency_contact, current_medication, created_at

### API Endpoints
- **POST /generate-health-id**: Creates unique Health ID and validates basic data
- **POST /complete-registration**: Saves user and health profile data
- **POST /fingerprint-scan**: Updates biometric verification status
- **POST /login**: Authenticates users with Health ID
- **GET /users**: Development endpoint for data verification

### Integration Capabilities
- **Healthcare Systems**: Extensible API design for hospital information systems
- **Government Databases**: Aadhar verification and identity management
- **Biometric Services**: Fingerprint and health scanning device integration
- **Multi-Language Content**: Template system for additional language support
- **Document Scanning**: Architecture prepared for medical document OCR