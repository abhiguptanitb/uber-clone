# GoNexi

GoNexi is a full-stack ride booking application with separate passenger and captain dashboards, live map tracking, vehicle-based fare options, Stripe checkout, real-time ride dispatch, and a small Gemini-powered ride recommendation feature.

## Features

### Passenger

- Register, login, logout, and protected passenger routes
- Live Mapbox tracking with current-location pickup support
- Pickup and destination search with Mapbox suggestions
- Vehicle options for GoNexiCar, GoNexiMoto, and GoNexiAuto
- Fare calculation from route distance and duration
- Real-time captain availability and estimated pickup time
- Gemini AI ride recommendation after fare options load
- Ride creation, cancellation, waiting screen, and ride status updates
- Pending payment guard before booking another ride
- Stripe checkout for completed ride payments

### Captain

- Register, login, logout, and protected captain routes
- Vehicle profile with type, plate, color, and capacity
- Live location sharing through Socket.io
- Online/offline availability cleanup on logout and disconnect
- Receive matching ride requests in real time
- Check pending ride queue for matching vehicle type
- Accept rides, start rides with OTP, and complete rides
- Daily earnings and paid ride stats

### Realtime And Intelligence

- Socket.io joins users and captains to the dispatch layer
- Active captain filtering uses status, socket connection, fresh heartbeat, vehicle type, and pickup distance
- Ride options show nearby captain count, closest pickup ETA, and availability
- Gemini recommendation endpoint suggests the best option without changing booking logic
- Rule-based recommendation fallback keeps the UI working if Gemini is not configured

## Tech Stack

### Backend

| Tool | Purpose |
| --- | --- |
| Node.js | Runtime |
| Express | REST API |
| MongoDB + Mongoose | Database and models |
| JWT | Authentication |
| Socket.io | Real-time dispatch and location updates |
| Mapbox | Geocoding, autocomplete, directions, distance/time |
| Stripe | Checkout and payment verification |
| Google Gemini API | AI ride recommendation |
| Express Validator | Request validation |
| bcrypt / bcryptjs | Password hashing |

### Frontend

| Tool | Purpose |
| --- | --- |
| React 18 | UI |
| Vite | Dev server and build |
| Tailwind CSS | Styling |
| Mapbox GL / react-map-gl | Interactive map |
| Socket.io Client | Real-time updates |
| Axios | API requests |
| React Router | Routing |
| Remix Icon | Icons |

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
```

## Environment Variables

### Backend `.env`

Create `Backend/.env`:

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

`GEMINI_API_KEY` is optional. If it is empty, the app uses the local rule-based recommendation fallback.

### Frontend `.env`

Create `Frontend/.env`:

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

## Running The App

Start the backend:

```bash
cd Backend
npm start
```

The backend runs on `http://localhost:4000` when `PORT=4000`.

Start the frontend:

```bash
cd Frontend
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Usage Flow

### Passenger Flow

1. Passenger logs in.
2. Passenger selects pickup and destination using search, current location, or the map.
3. App loads fare options for car, moto, and auto.
4. App shows captain availability, pickup ETA, fare, and AI suggestion.
5. Passenger chooses a vehicle and confirms the ride.
6. Matching online captains receive the ride through Socket.io.
7. Passenger waits for confirmation, tracks ride progress, and pays after completion.

### Captain Flow

1. Captain logs in.
2. Captain joins the socket dispatch layer and shares live location.
3. Captain receives matching ride requests for their vehicle type.
4. Captain accepts, starts ride with OTP, and completes the ride.
5. Captain can review ride queue and daily earnings.
6. Captain logout marks the captain inactive and clears socket availability.

## API Overview

### User Routes

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/users/register` | Register passenger | No |
| POST | `/users/login` | Login passenger | No |
| GET | `/users/profile` | Get passenger profile | User |
| GET | `/users/logout` | Logout passenger | User |

### Captain Routes

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/captains/register` | Register captain | No |
| POST | `/captains/login` | Login captain | No |
| GET | `/captains/profile` | Get captain profile | Captain |
| GET | `/captains/logout` | Logout and mark captain inactive | Captain |
| GET | `/captains/earnings/today` | Get daily captain earnings | Captain |
| GET | `/captains/:captainId/vehicle/vehicleType` | Get captain vehicle type | Captain |

### Map Routes

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/maps/get-coordinates` | Convert address to coordinates | User |
| GET | `/maps/get-distance-time` | Get route distance and duration | User |
| GET | `/maps/get-suggestions` | Address autocomplete | User |

### Ride Routes

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/rides/options` | Get fare, availability, and ETA for each vehicle | User |
| POST | `/rides/recommendation` | Get Gemini or fallback ride recommendation | User |
| GET | `/rides/get-fare` | Get basic fare object | User |
| GET | `/rides/confidence` | Get match confidence for selected vehicle | User |
| POST | `/rides/create` | Create ride and notify matching captains | User |
| POST | `/rides/confirm` | Captain accepts ride | Captain |
| GET | `/rides/captain/available` | Captain checks pending matching ride queue | Captain |
| POST | `/rides/cancel` | Passenger cancels pending ride | User |
| GET | `/rides/start-ride` | Start ride using OTP | Captain |
| POST | `/rides/end-ride` | Complete ride | Captain |
| POST | `/rides/payment/checkout-session` | Create Stripe checkout session | User |
| GET | `/rides/payment/verify` | Verify Stripe checkout session | User |
| GET | `/rides/payment/pending` | Check pending payment ride | User |
| GET | `/rides/:rideId` | Get ride by id | User |

## AI Recommendation

The AI feature is intentionally small. It does not control booking decisions.

Endpoint:

```http
POST /rides/recommendation
```

Request:

```json
{
  "pickup": "Baldeogarh, India",
  "destination": "Tikamgarh, India",
  "options": [
    {
      "type": "moto",
      "name": "GoNexiMoto",
      "fare": 449,
      "availableCaptains": 1,
      "estimatedPickupMinutes": 2,
      "isAvailable": true
    }
  ]
}
```

Response:

```json
{
  "recommendedType": "moto",
  "message": "GoNexiMoto looks best because it has a nearby captain and the lowest fare.",
  "source": "gemini"
}
```

If Gemini is unavailable, `source` becomes `rule`.

## Notes

- Restart the backend after changing `.env`.
- Keep API keys only in `.env`; do not commit real keys.
- The frontend uses `VITE_BASE_URL`, so backend port and frontend env must match.
- Captains only appear available when they are active, connected, recently seen, have a vehicle type match, and are within the dispatch radius.

## Author

Abhi Gupta

- GitHub: [@abhiguptanitb](https://github.com/abhiguptanitb)
