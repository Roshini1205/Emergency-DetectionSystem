# Emergency Detection System Backend

Node.js + Express API for authentication (sign up / sign in) with MongoDB Atlas.

## Endpoints

- POST `/api/auth/signup` — Create a new account
- POST `/api/auth/signin` — Log in and receive JWT
- GET `/api/health` — Health check

## Setup

1. Create a MongoDB Atlas cluster and get your connection URI.
2. In `backend`, create a `.env` file (copy from `.env.example`) and set:
   - `MONGODB_URI` — Atlas URI
   - `JWT_SECRET` — long random string
   - `PORT` — default `4000`
   - `CORS_ORIGIN` — frontend origin(s), e.g., `http://localhost:5173`

## Install & Run

```bash
cd backend
npm install
npm run dev
# or
npm start
```

## Request Examples

### Sign Up
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Roshini",
    "email": "user@example.com",
    "phone": "9999999999",
    "password": "strongpass"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:4000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "strongpass"
  }'
```

The response includes `token` (JWT) and `user` object.

## Notes
- Passwords are hashed with bcrypt.
- JWT expires in 7 days.
- Email is stored in lowercase.
- CORS is enabled for the frontend origin.
