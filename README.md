# GRAPH - Educational Platform

Modern educational platform with interactive knowledge visualization as a graph.

## Quick Start

\\\ash
docker-compose up -d
# Ready at http://localhost:3000
# Credentials: admin / admin123 or demo / demo123
\\\

## Technology Stack

| Component | Tech |
|-----------|------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind |
| **Backend** | FastAPI + SQLAlchemy + PostgreSQL |
| **Auth** | JWT + Refresh Tokens |
| **DevOps** | Docker Compose |

## Key Features

- Interactive Knowledge Graph - visualize lesson relationships
- Course System - Track > Course > Module > Lesson
- Progress Tracking - personal learning statistics  
- Admin Panel - content management
- Refresh Tokens - secure sessions (15 min access + 7 days refresh)
- Audit Logging - all actions are tracked
- Rate Limiting - protection against attacks

## Security

- JWT tokens (15 min access + 7 days refresh)
- Bcrypt password hashing
- SQL injection protection (SQLAlchemy ORM)
- CORS setup
- Rate limiting
- Input validation
- Audit logging

## API Documentation

\http://localhost:8000/docs\ (Swagger UI)
\http://localhost:8000/redoc\ (ReDoc)

Main endpoints:
- GET /api/v1/tracks - Learning tracks
- GET /api/v1/courses - Courses
- GET /api/v1/lessons - Lessons
- GET /api/v1/graph/nodes - Graph nodes
- POST /api/v1/auth/login - Login

## Fixed Issues (7 Critical)

1. Refresh Token mechanism - long-term sessions
2. Counter synchronization - database triggers
3. Audit logging - action tracking
4. Data validation - Pydantic validators
5. Rate Limiting - brute force protection
6. Error handling - custom exceptions
7. N+1 optimization - performance improvement

## Project Structure

\\\
backend/           # FastAPI server (port 8000)
src/               # React app (port 3000)
docker-compose.yml # Configuration
\\\

## License

MIT License
