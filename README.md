# Agro Career - Agro Career And Investment Platform

A comprehensive platform connecting livestock farmers with property owners for space rental, career development, and agricultural learning opportunities.

## Features

- **Authentication**: JWT-based user authentication
- **Property Management**: CRUD operations for livestock properties
- **Image Upload**: Property photo management via Supabase
- **Booking System**: Complete booking workflow with payment
- **Search & Filter**: Property discovery by type, location, price
- **User Dashboards**: Role-based interfaces for farmers and owners

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Supabase (PostgreSQL)
- **Frontend**: React, TypeScript, React Query, Zustand
- **Authentication**: JWT tokens
- **Storage**: Supabase Storage for images
- **Deployment**: Docker containers

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Docker
```bash
docker-compose up --build
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - User bookings

## Database Schema

- **users**: User accounts (farmers, owners)
- **properties**: Livestock properties for rent
- **bookings**: Rental bookings and payments

## MVP Status: 95% Complete

✅ Authentication system
✅ Property CRUD operations
✅ Image upload functionality
✅ Booking system
✅ Frontend UI components
✅ Basic deployment setup

**Remaining**: Payment integration, testing, production deployment
