# BotLeague

BotLeague is a full-stack platform for running robot competitions. It supports competitors, teams, robots, events, sports, registrations, tournament matches, rankings, achievements, chat, notifications, organizers, administrators, and super administrators.

## Documentation

- [Complete REST and WebSocket API reference](docs/API.md)
- [Backend module and package catalogue](docs/MODULES.md)
- [Frontend application](Botleague-Frontend/README.md)
- [Backend application](botleague-backend/README.md)

## Architecture

```text
React 19 + TypeScript + Redux + Vite
                |
        REST / JWT / STOMP
                |
Spring Boot 3.4 + Spring Security + JPA
                |
             PostgreSQL

Media uploads: Cloudflare R2 (S3-compatible)
Realtime: Spring STOMP/WebSocket
Email: Spring Mail / SMTP
```

The frontend is feature-oriented under `Botleague-Frontend/src/feature`. The backend is domain-oriented under `botleague-backend/src/main/java/com/botleague/backend`.

## Requirements

- Node.js compatible with Vite 8
- npm
- Java 17
- Maven 3.9+ or the included Maven wrapper
- PostgreSQL

## Local setup

### Database and backend

Create a PostgreSQL database, then supply configuration through environment variables. Do not commit real credentials.

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/BotLeague_Test"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "your-password"
cd botleague-backend
mvn spring-boot:run
```

The backend listens on `http://localhost:8081`; REST resources are below `/api`.

Additional production secrets—JWT signing material, SMTP credentials, and R2 credentials—must also be injected from the deployment environment. The checked-in development properties must never contain live secrets.

### Frontend

```powershell
cd Botleague-Frontend
npm install
$env:VITE_API_URL = "http://localhost:8081/api"
npm run dev
```

The frontend runs at `http://localhost:5173`. If `VITE_API_URL` is absent, it defaults to `http://localhost:8081/api`.

## Build and verification

```powershell
cd Botleague-Frontend
npm run build
npm run lint

cd ..\botleague-backend
mvn test
```

## Authentication and roles

The API uses short-lived JWT access tokens and a refresh token stored in an HTTP-only cookie. Protected requests use:

```http
Authorization: Bearer <access-token>
```

Role inheritance is:

```text
SUPER_ADMIN > ADMINISTRATOR > MANAGER > ORGANIZER > USER
```

Higher roles inherit lower-role permissions. The API is stateless, and the frontend automatically refreshes expired access tokens.

## Repository layout

```text
BotLeague/
|-- Botleague-Frontend/       React/Vite client
|   |-- src/app/              bootstrap and Redux store
|   |-- src/feature/          domain features
|   |-- src/routes/           route and role guards
|   `-- src/shared/           shared API, UI, and realtime code
|-- botleague-backend/        Spring Boot API
|   |-- src/main/java/...     controllers, services, repositories, entities
|   `-- src/main/resources/   runtime configuration
`-- docs/API.md               API contract and endpoint inventory
```

## Known technical notes

- API naming is not fully uniform: both `/api/v1/...` and `/api/...` are used, and the event creation controller uses case-sensitive `/api/Events`.
- Hibernate currently uses `ddl-auto=update`; production deployments should use versioned migrations.
- The test suite currently contains only a Spring context test and needs domain and API integration coverage.
- Route-level frontend code splitting is recommended because the current production bundle is large.
