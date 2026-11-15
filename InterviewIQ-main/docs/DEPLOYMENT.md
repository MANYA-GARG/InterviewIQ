# Deployment Guide

This document summarizes setup, configuration, and deployment notes for InterviewIQ.

## Prerequisites

- Node.js 18 or later.
- MongoDB Atlas account or a local MongoDB URI.
- Cloudinary account.
- Email account for OTP delivery.
- Groq API key.

## Environment Variables

### Backend

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes, or `MONGODB_URI` | MongoDB connection string. |
| `MONGODB_URI` | Yes, or `MONGO_URI` | Alternate MongoDB connection string used by the test runner. |
| `PORT` | No | Backend port. Defaults to `5000`. |
| `NODE_ENV` | No | Environment mode such as `development` or `production`. |
| `JWT_ACCESS_SECRET` | Yes | Access token secret. |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret. |
| `JWT_ACCESS_EXPIRY` | No | Access token expiry. |
| `JWT_REFRESH_EXPIRY` | No | Refresh token expiry. |
| `EMAIL_USER` | Yes | Email sender account for OTP and password reset. |
| `EMAIL_PASS` | Yes | Email account password or app password. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret. |
| `GROQ_API_KEY` | Optional | Groq-compatible API key for interview AI features. |
| `GROQ_MODEL` | Optional | Groq model override. |
| `FRONTEND_URL` | No | Frontend origin used by config defaults. |
| `FRONTEND_URLS` | No | Comma-separated allowlist used by CORS in the server entry point. |
| `REQUEST_TIMEOUT_MS` | No | Request timeout override. |
| `TEST_SECRET` | Optional | Dev-only secret for the test routes. |
| `HUGGINGFACE_API_KEY` | Optional | Reserved by the codebase for the Hugging Face service wrapper. |

### Frontend

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | No | Backend API base URL used by Axios and service clients. |

## Installation

```bash
cd "Mern Stack"
npm install

cd backend
npm install

cd ..\frontend
npm install
```

## Frontend Setup

```bash
cd frontend
npm run dev
```

## Backend Setup

```bash
cd backend
npm run dev
```

## Production Build

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Deployment Notes

- The backend uses JWT authentication, OTP flows, request validation, upload handling, and CORS origin allowlisting.
- Resume uploads rely on Cloudinary and the backend upload middleware.
- Groq-backed features depend on a valid `GROQ_API_KEY` when AI functionality is required.
- The repository also supports `MONGO_URI` and `MONGODB_URI` because the backend and test runner consume both names.

> [!NOTE]
> The project includes a root `npm run dev` command that starts the backend and frontend together through `concurrently`.

## Troubleshooting

| Issue | Check |
|---|---|
| Backend will not start | Verify `MONGO_URI` or `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. |
| Emails are not sending | Verify `EMAIL_USER` and `EMAIL_PASS`. |
| Resume uploads fail | Verify the Cloudinary credentials. |
| AI features are unavailable | Verify `GROQ_API_KEY` and the configured model. |
| Frontend cannot reach the API | Verify `VITE_API_URL` and the backend port. |