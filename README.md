# LifeLink 🩸
**Real-Time Blood & Plasma Donor Matching and Emergency Response System**  
*“Connecting Every Lifesaving Donation to Those Who Need It.”*

---

## 🏛 System Architecture
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
       Matching Engine ◄──────── Donor profile
             │
     ┌───────┴────────┐
     │                │
Eligibility       Compatibility
     │                │
     └───────┬────────┘
             │
          PostGIS
             │
       Find nearby donors
             │
             ▼
       Ranking Engine
             │
             ▼
       Notify donors
             │
       ┌─────┴─────┐
       │           │
    ACCEPT       NO RESPONSE
       │           │
       ▼           ▼
    MATCHED    ESCALATE
                   │
                   ▼
             Increase radius
                   │
                   ▼
             Find more donors
```

---

## 📂 Project Directory Structure
```
LifeLink/
│
├── backend/       # Spring Boot (Java 21, Spring Security, PostGIS, Redis, WebSocket)
├── frontend/      # React + Vite (Donor & Hospital Dashboards)
├── database/      # PostgreSQL + PostGIS SQL initialization scripts
├── docs/          # Architecture diagrams, ER models, API documentation
└── README.md
```

---

## 🚀 Checkpoints Roadmap
- [x] **[1] Project + Database Foundation**: Spring Boot 3 + PostgreSQL/PostGIS setup & User entity
- [ ] **[2] Authentication + JWT**: Secure registration, login, and role-based access
- [ ] **[3] Donor Management**: Profiles, blood group, component preferences, live availability
- [ ] **[4] Hospital Management**: Hospital onboarding, verification, and geocoding
- [ ] **[5] Blood Requests**: Urgent requests with unit requirements and urgency levels
- [ ] **[6] Compatibility Engine**: Whole blood and inverted plasma compatibility matrices
- [ ] **[7] Eligibility Engine**: Minimum donation intervals, age/weight, and deferral rules
- [ ] **[8] PostGIS Matching**: Spatial radius matching with `ST_DWithin` and `ST_Distance`
- [ ] **[9] Redis + Escalation**: Multi-tier radius expansion and distributed acceptance locks
- [ ] **[10] WebSocket Live Updates**: Real-time push notifications and hospital live streams
- [ ] **[11] React Frontend**: Portals for Donors, Hospitals, and System Admins
- [ ] **[12] Testing**: Comprehensive unit and integration test coverage
- [ ] **[13] Docker + Deployment**: Single-command `docker compose up` deployment
