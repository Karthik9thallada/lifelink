# LifeLink 🩸
**Real-Time Blood & Plasma Donor Matching and Emergency Response System**  
*“Connecting Every Lifesaving Donation to Those Who Need It.”*

---

## 🏛 1. System Overview & Architecture

When medical emergencies strike, minutes determine outcomes. **LifeLink** is a mission-critical emergency response grid that bridges urgent hospital requirements with eligible blood and plasma donors in real time.

LifeLink combines **spatial proximity** (PostGIS & Haversine distance), **biological compatibility** (standard whole blood/RBC universal donor rules and inverted plasma donor rules), **donor safety** (mandatory interval gap eligibility checks), **multi-tier radius escalation**, and **distributed concurrency locking** (Redis) to coordinate life-saving donations.

```
                         LIFELINK
                            │
             ┌──────────────┴──────────────┐
             │                             │
          HOSPITAL                       DONOR
             │                             │
      Create blood request          Register / Login
             │                             │
             ▼                             ▼
       Matching Engine ◄──────── Donor profile (GPS Location)
             │
     ┌───────┴────────┐
     │                │
Eligibility       Compatibility
(Interval Gaps)  (ABO/Rh Matrix)
     │                │
     └───────┬────────┘
             │
          PostGIS
     (Spatial Radius)
             │
             ▼
       Ranking Engine
             │
             ▼
       Notify Donors ─────────► [STOMP /topic/donors/{id}]
             │
       ┌─────┴─────┐
       │           │
    ACCEPT       NO RESPONSE
       │           │
       ▼           ▼
    MATCHED    ESCALATE (Radius Expansion: 5km → 10km → 25km → 50km)
 (Redis Lock)      │
       │           ▼
       └─────► [STOMP /topic/requests/{id}] (Hospital Live Console)
```

---

## 🚀 2. Verified Checkpoints Roadmap

- [x] **[1] Project & Database Foundation**: Spring Boot 3.3.5, PostgreSQL + PostGIS extension, JPA geometry entities, and H2 test profile.
- [x] **[2] Authentication & Security (JWT)**: JJWT 0.12.6, BCrypt hashing, stateless filters, role-based access (`DONOR`, `HOSPITAL`, `ADMIN`).
- [x] **[3] Donor Management**: Blood groups, component preferences, PostGIS point geometries, live availability toggles, GPS updater.
- [x] **[4] Hospital Management**: Hospital profiles, geocoding coordinates, verification status, and admin approval lifecycle.
- [x] **[5] Blood Requests**: Multi-unit emergency requests, urgency classifications (`CRITICAL`, `URGENT`, `NORMAL`), and status tracking.
- [x] **[6] Compatibility Engine**: Biological ABO/Rh matching matrices for Whole Blood, RBC, and inverted Plasma rules.
- [x] **[7] Eligibility Engine**: Medical interval gaps (Whole Blood: 56d, Plasma: 14d, Platelets: 7d) and donor recovery checks.
- [x] **[8] Spatial Matching & Ranking**: Haversine distance calculations, proximity scoring, candidate ranking, and match persistence.
- [x] **[9] Redis & Escalation**: Progressive search radius expansion (5km → 10km → 25km → 50km) and atomic distributed locking for acceptance.
- [x] **[10] WebSocket Live Streaming**: STOMP over WebSocket broker (`/ws`, `/topic`), donor alerts, and hospital live update stream.
- [x] **[11] React Frontend**: Modern React SPA (Tailwind CSS, Lucide icons, Axios interceptors, STOMP client) with Donor & Hospital dashboards.
- [x] **[12] Comprehensive Testing**: 30 automated tests across unit, integration, concurrency, and end-to-end emergency simulation.
- [x] **[13] Docker Containerization**: Multi-stage Dockerfiles for backend and frontend, and production-ready `docker-compose.yml`.

---

## 🧬 3. Medical & Compatibility Rules

### 3.1 ABO/Rh Biological Matrix
| Recipient Blood Group | Compatible Whole Blood / RBC Donors | Compatible Plasma Donors (Inverted!) |
|---|---|---|
| **O-** | `O-` (Universal Whole Blood / RBC Donor) | `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+` |
| **O+** | `O-`, `O+` | `O+`, `A+`, `B+`, `AB+` |
| **A-** | `O-`, `A-` | `A-`, `A+`, `AB-`, `AB+` |
| **A+** | `O-`, `O+`, `A-`, `A+` | `A+`, `AB+` |
| **B-** | `O-`, `B-` | `B-`, `B+`, `AB-`, `AB+` |
| **B+** | `O-`, `O+`, `B-`, `B+` | `B+`, `AB+` |
| **AB-** | `O-`, `A-`, `B-`, `AB-` | `AB-`, `AB+` |
| **AB+** | `All Blood Groups` (Universal Recipient) | `AB+` (Universal Plasma Donor: `AB`) |

### 3.2 Minimum Interval Recovery Gaps
- **Whole Blood**: Mandatory **56 days** recovery.
- **Plasma**: Mandatory **14 days** recovery.
- **Platelets**: Mandatory **7 days** recovery.

---

## 🌐 4. API Endpoints Catalog

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account (`DONOR`, `HOSPITAL`) | Public |
| `POST` | `/api/auth/login` | Authenticate with email/password and obtain JWT | Public |

### Donors (`/api/donors`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/donors/me` | Fetch authenticated donor profile | `DONOR`, `ADMIN` |
| `POST` | `/api/donors/profile` | Create or update donor blood profile & location | `DONOR`, `ADMIN` |
| `PATCH` | `/api/donors/availability` | Toggle live radar availability | `DONOR` |
| `PATCH` | `/api/donors/location` | Update live GPS coordinates | `DONOR` |

### Hospitals (`/api/hospitals` & `/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/hospitals` | List verified hospitals in network | Public |
| `GET` | `/api/hospitals/me` | Fetch authenticated hospital profile | `HOSPITAL`, `ADMIN` |
| `POST` | `/api/hospitals/profile` | Create or update hospital location & emergency info | `HOSPITAL` |
| `PATCH` | `/api/admin/hospitals/{id}/verify` | Approve or revoke hospital verification | `ADMIN` |

### Blood Requests (`/api/requests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/requests` | Post new urgent blood/plasma requirement | `HOSPITAL` |
| `GET` | `/api/requests/hospital/my` | View all active & past requests for my hospital | `HOSPITAL` |
| `GET` | `/api/requests/{id}` | Get request details by ID | Authenticated |
| `PATCH` | `/api/requests/{id}/cancel` | Cancel an open emergency request | `HOSPITAL` |

### Matching & Escalation (`/api/matching` & `/api/escalation`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/matching/requests/{id}/find` | Execute spatial compatibility matching engine | `HOSPITAL`, `ADMIN` |
| `GET` | `/api/matching/requests/{id}/matches` | View notified donors and ranking scores | `HOSPITAL`, `ADMIN` |
| `GET` | `/api/matching/donors/me/matches` | View incoming emergency requests for donor | `DONOR` |
| `POST` | `/api/matching/requests/{id}/accept` | Atomically accept donation (concurrency-locked) | `DONOR` |
| `POST` | `/api/escalation/requests/{id}/escalate`| Escalate search radius to next tier (5→10→25→50km)| `HOSPITAL` |

### STOMP WebSocket Channels (`/ws`)
| Destination | Description | Subscribers |
|---|---|---|
| `/topic/requests` | Global emergency blood request broadcast feed | All clients |
| `/topic/requests/{id}` | Live stream for hospital console (matches, escalations, acceptances) | Hospital staff |
| `/topic/donors/{id}` | Private emergency alert channel for specific donor | Matched donor |

---

## ⚡ 5. How to Run LifeLink

### Option A: Single Command via Docker Compose (Recommended)
Make sure Docker Desktop is running, then run:

```bash
docker compose up --build -d
```

The stack will start:
- **Frontend Web UI**: `http://localhost:3000`
- **Backend Spring Boot API**: `http://localhost:8080`
- **PostgreSQL + PostGIS**: `localhost:5432`
- **Redis Cache & Lock**: `localhost:6379`

To view logs:
```bash
docker compose logs -f
```

To stop:
```bash
docker compose down
```

---

### Option B: Local Development Setup

#### 1. Start Infrastructure (PostgreSQL + PostGIS & Redis)
```bash
docker compose up -d lifelink-postgres lifelink-redis
```

#### 2. Run Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
*(Backend runs on `http://localhost:8080`)*

#### 3. Run React Frontend
```bash
cd frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:5173` with automated API proxying to port 8080)*

---

## 🧪 6. Running Automated Tests

LifeLink includes a 30-test suite with 100% passing tests covering biological compatibility, spatial radius matching, Redis lock concurrency protection, WebSocket dispatching, and end-to-end emergency lifecycles:

```bash
cd backend
mvn test
```

Expected result:
```
[INFO] Results:
[INFO] Tests run: 30, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 🔑 7. Demo Accounts for Evaluation

| Role | Email | Password | Description |
|---|---|---|---|
| **Hospital** | `apex@lifelink.org` | `password123` | Apex Emergency Hospital (MG Road Central Hub) |
| **Donor (Tier 1)** | `donora.escl@lifelink.org` | `password123` | Rahul Sharma (O+ RBC, ~2.2 km away) |
| **Donor (Tier 2)** | `donorb.escl@lifelink.org` | `password123` | Sunita Rao (O+ RBC, ~8.2 km away) |
| **Admin** | `admin@lifelink.org` | `admin123` | Network Administrator |
