# API Documentation

This document contains the detailed API reference for InterviewIQ.

## Authentication

<details>
<summary>Authentication APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `name`, `email`, `password` | Registration result. |
| POST | `/api/auth/verify-otp` | No | `email`, `otp` | Verified account and login payload. |
| POST | `/api/auth/login` | No | `email`, `password` | `token`, `user`, `refreshToken`. |
| POST | `/api/auth/refresh-token` | No | `refreshToken` | New access token response. |
| POST | `/api/auth/resend-otp` | No | `email` | OTP resend result. |
| POST | `/api/auth/forgot-password` | No | `email` | Reset OTP result. |
| POST | `/api/auth/reset-password` | No | `email`, `otp`, `newPassword` | Password reset result. |
| POST | `/api/auth/logout` | Route has no middleware | None required in route | Logout result. |

</details>

## Users

<details>
<summary>User APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| GET | `/api/users/profile` | Yes | None | Current user profile. |
| PUT | `/api/users/profile` | Yes | `name`, `email` | Updated profile. |
| DELETE | `/api/users/account` | Yes | None | Account deletion result. |
| GET | `/api/users` | Admin only | None | All users. |

</details>

## Resume

<details>
<summary>Resume APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/resumes` | Yes | Multipart file field `resume` | Uploaded resume and analysis. |
| GET | `/api/resumes` | Yes | None | User resume list. |
| GET | `/api/resumes/:id` | Yes | None | Resume details. |
| GET | `/api/resumes/:id/analysis` | Yes | None | Resume analysis record. |
| DELETE | `/api/resumes/:id` | Yes | None | Resume deletion result. |

</details>

## Interview

<details>
<summary>Interview APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/interviews` | Yes | `jobRole`, `experienceLevel`, `numberOfQuestions`, `mode`, `timerDuration`, `resumeId` | Created interview. |
| GET | `/api/interviews` | Yes | None | User interviews. |
| GET | `/api/interviews/:id` | Yes | None | Interview details. |
| POST | `/api/interviews/:id/start` | Yes | None | Interview start result. |
| POST | `/api/interviews/:id/complete` | Yes | None | Interview completion result. |
| POST | `/api/interviews/:id/activity` | Yes | Suspicious activity payload | Activity log result. |
| DELETE | `/api/interviews/:id` | Yes | None | Interview deletion result. |
| POST | `/api/interviews/answer` | Yes | `questionId`, `answerText`, `timeTaken` | Saved text answer. |
| POST | `/api/interviews/answer/voice` | Yes | Multipart file field `audio` | Saved voice answer. |

</details>

## Evaluation

<details>
<summary>Evaluation APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/evaluations/:interviewId/evaluate` | Yes | None | Evaluation creation result. |
| GET | `/api/evaluations/:interviewId/result` | Yes | None | Interview result view. |
| GET | `/api/evaluations/:interviewId` | Yes | None | Evaluation details. |
| GET | `/api/evaluations` | Yes | None | User evaluations. |

</details>

## Dashboard

<details>
<summary>Dashboard APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| GET | `/api/dashboard/summary` | Yes | None | Summary metrics. |

</details>

## Reports

<details>
<summary>Report APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| GET | `/api/reports/progress` | Yes | None | User progress. |
| GET | `/api/reports/detailed` | Yes | None | Detailed report. |
| GET | `/api/reports/trend` | Yes | None | Score trend. |
| GET | `/api/reports/trend/aggregate` | Yes | None | Aggregated trend. |
| GET | `/api/reports/performance` | Yes | None | Performance over time. |
| GET | `/api/reports/category-scores` | Yes | None | Category scores. |
| GET | `/api/reports/skills` | Yes | None | Skill distribution. |
| GET | `/api/reports/insights` | Yes | None | Smart insights. |
| GET | `/api/reports/heatmap` | Yes | None | Heatmap data. |
| GET | `/api/reports/progress-trends` | Yes | None | Progress trends. |

</details>

## Analysis

<details>
<summary>Analysis APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/analysis/quick` | No | `question`, `answer`, `expectedAnswer` | Quick analysis result. |
| GET | `/api/analysis/status` | No | None | Analysis service status. |
| POST | `/api/analysis/answer/:answerId` | Yes | None | Single-answer analysis. |
| POST | `/api/analysis/regenerate/:answerId` | Yes | None | Regenerated analysis. |
| GET | `/api/analysis/export/:answerId` | Yes | None | Exported analysis. |
| POST | `/api/analysis/interview/:interviewId` | Yes | None | Full interview analysis. |
| POST | `/api/analysis/batch` | Yes | `answerIds` | Batch analysis result. |

</details>

## AI

<details>
<summary>AI APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/ai/generate` | No | `prompt` | Groq-backed assistant response. |
| POST | `/api/ai/analyze-resume` | No | `text` | Resume summary response. |

</details>

## System

<details>
<summary>System APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| GET | `/` | No | None | API running message. |
| GET | `/api/health` | No | None | Backend health and DB status. |

</details>

## Development

<details>
<summary>Development Test APIs</summary>

| Method | Endpoint | Auth Required | Request Body | Response |
|---|---|---|---|---|
| GET | `/api/test/health` | Dev only | None | Test endpoint status. |
| GET | `/api/test/mock-data` | Dev only | None | Mock data structure. |
| POST | `/api/test/run-flow` | Dev only | Test flow payload | Full flow test result. |
| POST | `/api/test/cleanup` | Dev only | None | Test data cleanup result. |
| POST | `/api/test/full` | Dev only | None | Test plus cleanup result. |

</details>