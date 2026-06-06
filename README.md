# GoNexi

![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox-Maps-000000?style=for-the-badge&logo=mapbox&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

GoNexi is a full-stack ride booking platform built with a React/Vite frontend and an Express/MongoDB backend. It supports passenger ride booking, captain dashboards, real-time location tracking, live ride dispatch, Mapbox-powered fares and routing, Stripe payments, and a lightweight Gemini AI ride recommendation feature.

## Table of Contents

- [Overview](#overview)
- [Current Features](#current-features)
- [AI Features](#ai-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Services and Ports](#services-and-ports)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [API Map](#api-map)
- [Demo Flow](#demo-flow)
- [Build](#build)
- [Notes](#notes)

## Overview

GoNexi has two main user experiences:

- Passenger dashboard for booking and tracking rides.
- Captain dashboard for going online, receiving ride requests, accepting rides, and viewing earnings.

The app uses Socket.io for live dispatch and location updates. Mapbox handles search, geocoding, distance, duration, and maps. Stripe handles completed ride payments. Gemini adds a small AI suggestion layer that recommends one ride option after fares are loaded.

## Current Features

### Passenger

- Passenger registration, login, logout, and protected routes
- Pickup and destination search with Mapbox suggestions
- Current location and map-click pickup/destination selection
- Live map tracking
- Fare options for GoNexiCar, GoNexiMoto, and GoNexiAuto
- Captain availability count and estimated pickup time
- Ride confirmation and waiting flow
- Pending payment guard before booking another ride
- Stripe checkout for ride payments

### Captain

- Captain registration, login, logout, and protected routes
- Vehicle profile with vehicle type, color, plate, and capacity
- Online status and live location sharing
- Realtime ride requests through Socket.io
- Matching ride queue for available pending rides, ranked by pickup distance, fare, and request freshness
- Accept ride, start ride with OTP, and complete ride
- Daily earnings and paid ride stats
- Logout/disconnect cleanup so offline captains stop showing as available

### Realtime Dispatch

- User and captain socket join events
- User and captain live location updates
- Captain heartbeat with `lastSeenAt`
- Availability filtering by active status, socket connection, heartbeat freshness, vehicle type, and pickup distance
- Realtime ride confirmation and ride-start events

## AI Features

GoNexi intentionally uses a small AI feature instead of making AI control the app.

### Gemini Ride Recommendation

After passenger fare options load, the frontend calls:

```http
POST /rides/recommendation
```

The backend sends Gemini:

- Pickup
- Destination
- Available vehicle options
- Fare
- Pickup ETA
- Nearby captain count
- Availability status

Gemini returns one short recommendation:

```json
{
  "recommendedType": "moto",
  "message": "GoNexiMoto looks best because it has a nearby captain and the lowest fare.",
  "source": "gemini"
}
```

If `GEMINI_API_KEY` is not configured or Gemini fails, GoNexi falls back to a local rule-based recommendation and keeps the UI working.

## Architecture

```text
                         +-----------------------------+
                         |          Frontend           |
                         |     React + Vite + CSS      |
                         +--------------+--------------+
                                        |
           +----------------------------+----------------------------+
           |                            |                            |
           v                            v                            v
+--------------------+       +--------------------+       +--------------------+
| Passenger Dashboard|       | Captain Dashboard  |       | Protected Routing  |
| Booking Flow       |       | Ride Queue         |       | User/Captain Auth  |
| Fare Options       |       | Earnings           |       | JWT Storage        |
+---------+----------+       +---------+----------+       +---------+----------+
          |                            |                            |
          +----------------------------+----------------------------+
                                       |
                                       v
                         +-----------------------------+
                         |        Express API          |
                         | Controllers / Routes        |
                         | Validation / Auth           |
                         +--------------+--------------+
                                        |
       +--------------------------------+--------------------------------+
       |                                |                                |
       v                                v                                v
+--------------+              +----------------+              +----------------+
| Ride Service |              | Map Service    |              | AI Service     |
| Fare/Options |              | Mapbox APIs    |              | Gemini API     |
| Dispatch     |              | Distance/ETA   |              | Fallback Logic |
+------+-------+              +-------+--------+              +--------+-------+
       |                              |                                |
       v                              v                                v
+--------------+              +----------------+              +----------------+
| MongoDB      |              | Socket.io      |              | Stripe         |
| Users        |<------------>| Live Dispatch  |              | Checkout       |
| Captains     |              | Location       |              | Verification   |
| Rides        |              | Ride Events    |              |                |
+--------------+              +----------------+              +----------------+
```

## Tech Stack

### Backend

| Technology | Purpose |
| --- | --- |
| Node.js | Runtime |
| Express | REST API |
| MongoDB | Database |
| Mongoose | ODM and models |
| JWT | Authentication |
| Socket.io | Realtime ride dispatch |
| Mapbox | Geocoding, autocomplete, directions, distance/time |
| Stripe | Checkout and payment verification |
| Gemini API | AI ride recommendation |
| Express Validator | Request validation |
| bcrypt / bcryptjs | Password hashing |

### Frontend

| Technology | Purpose |
| --- | --- |
| React 18 | UI framework |
| Vite | Dev server and production build |
| Tailwind CSS | Styling |
| Mapbox GL / react-map-gl | Interactive map |
| Socket.io Client | Realtime socket events |
| Axios | API calls |
| React Router | Client-side routing |
| Remix Icon | UI icons |

## Project Structure

```text
GoNexi/
  Backend/
    controllers/
      captain.controller.js
      map.controller.js
      ride.controller.js
      user.controller.js
    db/
      db.js
    middlewares/
      auth.middleware.js
    models/
      blacklistToken.model.js
      captain.model.js
      ride.model.js
      user.model.js
    routes/
      captain.routes.js
      maps.routes.js
      ride.routes.js
      user.routes.js
    services/
      ai.service.js
      captain.service.js
      maps.service.js
      ride.service.js
      stripe.service.js
      user.service.js
    app.js
    server.js
    socket.js

  Frontend/
    src/
      components/
      context/
      hooks/
      pages/
      App.jsx
      main.jsx
    index.html
    package.json
```

## Services and Ports

| Service | Port | URL |
| --- | --- | --- |
| Frontend | `5173` | `http://localhost:5173` |
| Backend API | `4000` | `http://localhost:4000` |
| MongoDB | Atlas/local | From `DB_CONNECT` |
| Mapbox | External API | `https://api.mapbox.com` |
| Gemini | External API | `https://generativelanguage.googleapis.com` |
| Stripe | External API | Stripe Checkout |

## Environment Variables

### Backend `.env`

```env
PORT=4000
DB_CONNECT=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

STRIPE_SECRET_KEY=your_stripe_secret_key
FRONTEND_URL=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### Frontend `.env`

```env
VITE_BASE_URL=http://localhost:4000
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

## Installation

Install backend dependencies:

```bash
cd Backend
npm install
```

Install frontend dependencies:

```bash
cd Frontend
npm install
```

## Running Locally

Start the backend:

```bash
cd Backend
npm start
```

Start the frontend:

```bash
cd Frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## API Map

### Users

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/users/register` | Register passenger | No |
| POST | `/users/login` | Login passenger | No |
| GET | `/users/profile` | Passenger profile | User |
| GET | `/users/logout` | Logout passenger | User |

### Captains

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/captains/register` | Register captain | No |
| POST | `/captains/login` | Login captain | No |
| GET | `/captains/profile` | Captain profile | Captain |
| GET | `/captains/logout` | Logout and mark inactive | Captain |
| GET | `/captains/earnings/today` | Daily earnings | Captain |
| GET | `/captains/:captainId/vehicle/vehicleType` | Vehicle type | Captain |

### Maps

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/maps/get-coordinates` | Address to coordinates | User |
| GET | `/maps/get-distance-time` | Route distance and duration | User |
| GET | `/maps/get-suggestions` | Address suggestions | User |

### Rides

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/rides/options` | Fare, ETA, and availability options | User |
| POST | `/rides/recommendation` | Gemini/fallback ride recommendation | User |
| GET | `/rides/get-fare` | Basic fare calculation | User |
| GET | `/rides/confidence` | Match confidence for selected vehicle | User |
| POST | `/rides/create` | Create ride and notify captains | User |
| POST | `/rides/confirm` | Captain accepts ride | Captain |
| GET | `/rides/captain/available` | Captain ride queue with match scores | Captain |
| POST | `/rides/cancel` | Cancel pending ride | User |
| PATCH | `/rides/start-ride` | Start ride using OTP | Captain |
| POST | `/rides/end-ride` | Complete ride | Captain |
| POST | `/rides/payment/checkout-session` | Create Stripe checkout | User |
| GET | `/rides/payment/verify` | Verify Stripe payment | User |
| GET | `/rides/payment/pending` | Pending payment guard | User |
| GET | `/rides/:rideId` | Ride details | User |

## Demo Flow

### Passenger

1. Register or login as a passenger.
2. Select pickup and destination.
3. Click `Find Your Ride`.
4. Review fare options and Gemini/Smart Suggestion.
5. Choose a vehicle.
6. Confirm the ride.
7. Track ride status and complete payment if required.

### Captain

1. Register or login as a captain.
2. Allow location access.
3. Stay online on the captain dashboard.
4. Receive matching ride requests.
5. Accept, start with OTP, and complete the ride.
6. Review ride queue and daily earnings.

## Build

Build frontend:

```bash
cd Frontend
npm run build
```

Run frontend lint:

```bash
cd Frontend
npm run lint
```

## Notes

- Restart the backend after changing `.env`.
- Keep real API keys out of git.
- `GEMINI_API_KEY` is optional because the app has a rule-based fallback.
- Passenger availability depends on active captains with fresh socket heartbeats.
- Ride documents use Mongoose timestamps; the captain queue also falls back to the MongoDB ObjectId timestamp for older rides without `createdAt`.
- If a captain logs out, their `status` becomes inactive and `socketId` is cleared.
- Frontend `VITE_BASE_URL` must match the backend port.

## Author

Abhi Gupta

- GitHub: [@abhiguptanitb](https://github.com/abhiguptanitb)
