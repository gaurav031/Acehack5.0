# Smart Tourist Safety Monitoring & Incident Response System
## Technical Planning Document (PLAN.md)

---

### SECTION 1 — PROJECT OVERVIEW

#### Problem Statement
Tourists visiting unfamiliar destinations often face safety risks, including getting lost in undocumented areas, language barriers during emergencies, loss of physical identification documents, and lack of real-time safety information. Traditional emergency response systems are often reactive rather than proactive.

#### Why Tourist Safety is Important
Safety is the primary driver for global tourism. A single high-profile incident can lead to travel advisories that devastate local economies. Providing a digital "guardian angel" enhances the destination's brand and ensures the well-being of visitors.

#### Real-World Use Cases
- **The Lost Hiker:** A tourist goes off-path in a national park; geo-fencing detects the deviation and alerts authorities.
- **Identity Theft:** Physical passport is stolen; the tourist uses their Blockchain Digital ID for verification at a local embassy.
- **Immediate Panic:** A tourist feels threatened in an alley; pressing the SOS button streams live location to the nearest police unit.

#### Target Users
- **Tourists:** Individual and group travelers.
- **Authorities/Police:** Direct responders to incidents.
- **Tourism Departments:** For data analytics and safety policy making.

#### Expected System Impact
- 40% reduction in response time for tourist-related emergencies.
- Enhanced trust in local tourism infrastructure.
- Secure, immutable identity management.

---

### SECTION 2 — SYSTEM ARCHITECTURE

#### High-Level ASCII Architecture
```text
      +-----------------------+          +------------------------+
      |  Mobile App (React N) | <------> | Admin Dashboard (React)|
      +-----------+-----------+          +-----------+------------+
                  |                                  |
                  |          HTTPS / WSS             |
                  v                                  v
      +-----------------------------------------------------------+
      |                   API Gateway (Express.js)                |
      +------------------------------+----------------------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
+--------v----------+      +---------v---------+      +----------v---------+
|   AI Layer        |      |  Backend Logic    |      | Blockchain Layer   |
| (Gemini Flash/Pro)|      |  (Node / Socket)  |      | (Ethereum/Solidity)|
+-------------------+      +---------+---------+      +--------------------+
                                     |
                           +---------v---------+
                           |   Database Layer  |
                           |     (MongoDB)     |
                           +-------------------+
```

#### Communication Mechanism
- **REST APIs:** For CRUD operations, authentication, and report submissions.
- **WebSockets (Socket.io):** For real-time location streaming and SOS alert broadcasts.
- **JSON-RPC:** For backend-to-blockchain communication.
- **Google SDKs:** For AI inference and Map rendering.

---

### SECTION 3 — SYSTEM DATA FLOW

1.  **User Registration:** Tourist signs up -> JWT issued -> Wallet initialized via backend.
2.  **Blockchain ID Creation:** Passport info hashed -> Stored on-chain via Smart Contract -> QR code generated for mobile app.
3.  **GPS Tracking:** App sends periodic coordinates via Socket.io to Backend.
4.  **Geo-fencing Alerts:** Backend calculates distance from "Safe Zones" or proximity to "High-Risk Zones" -> Triggers Push Notification.
5.  **SOS Emergency Response:** User taps SOS -> Socket.io emits `emergency` event -> Admin Dashboard flashes red -> Nearest responder dispatched.
6.  **Incident Reporting:** User uploads photo/text -> Gemini AI categorizes risk -> Notification sent to relevant dept.
7.  **AI Chatbot:** User asks "Where is the nearest police station?" -> Gemini processes with RAG (Retrieval Augmented Generation) -> Dynamic response.

---

### SECTION 4 — TECH STACK JUSTIFICATION

- **React Native:** Cross-platform (iOS/Android) with native performance; essential for accessing GPS and camera sensors.
- **Node.js + Express:** Event-driven, non-blocking I/O; perfect for high-concurrency location updates.
- **MongoDB:** Flexible schema for varied incident reports and rapid geospatial queries using `$near` and `$geoWithin`.
- **Ethereum/Polygon:** Industry standard for smart contracts. (Polygon recommended for lower gas fees).
- **Gemini AI:** Advanced multi-modal capabilities; handles text-based safety advice and image-based incident analysis efficiently.
- **Socket.io:** Reliable real-time bidirectional communication with fallback options.

---

### SECTION 5 — COMPLETE FEATURE LIST

#### Mobile App Features
- **Blockchain Identity:** Secure QR-based digital ID.
- **Live Safe Map:** Highlights safe/unsafe zones with heatmaps.
- **SOS Panic Button:** One-touch emergency broadcast.
- **AI Safety Assistant:** 24/7 multilingual support.
- **Incident Reporter:** Multi-modal (photo/voice/text) reports.
- **Safe Route Suggestion:** AI-powered route planning avoiding high-crime areas.

#### Admin Dashboard Features
- **Live Command Center:** Real-time visibility of all active tourists.
- **Incident Triage:** Categorizing and assigning responders to SOS alerts.
- **Risk Heatmaps:** Visualizing crime/danger trends geographically.
- **Broadcast System:** Sending emergency alerts to all tourists in a specific zone.
- **Analytics:** Post-incident review and safety metrics.

---

### SECTION 6 — PHASE-WISE DEVELOPMENT ROADMAP

1.  **Phase 1 — Project Architecture & Setup:** Dockerizing env, linting rules.
2.  **Phase 2 — Authentication System:** JWT, Google OAuth.
3.  **Phase 3 — Mobile App Foundation:** Basic UI, Navigation.
4.  **Phase 4 — GPS Tracking:** Background location services.
5.  **Phase 5 — Geo-Fencing Engine:** Spacial calculations, Zone management.
6.  **Phase 6 — SOS Emergency System:** Socket integration, Admin notifications.
7.  **Phase 7 — Blockchain Digital ID:** Solidity contract, Ethers.js integration.
8.  **Phase 8 — AI Risk Analysis:** Gemini integration for report parsing.
9.  **Phase 9 — AI Chatbot Integration:** RAG for local safety info.
10. **Phase 10 — Admin Dashboard:** Map integration, real-time table.
11. **Phase 11 — Security Hardening:** Penetration testing, DB encryption.
12. **Phase 12 — Deployment:** CI/CD to AWS/Azure.

---

### SECTION 7 — TASK BREAKDOWN

#### Phase 1: Setup
- Initialize Git repo.
- Setup Node.js Boilerplate with TypeScript.
- Initialize React Native project.
- Configure MongoDB Atlas.

#### Phase 5: Geo-Fencing (Critical Path)
- Create `GeoZone` model.
- Implement `turf.js` on backend for point-in-polygon checks.
- Build Zone Management API.

---

### SECTION 8 — DATABASE DESIGN (MongoDB)

#### Collections

**Tourists**
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "blockchainAddress": "String",
  "currentLocation": { "type": "Point", "coordinates": [lng, lat] },
  "lastUpdated": "Date"
}
```

**Incidents**
```json
{
  "_id": "ObjectId",
  "reportedBy": "ObjectId",
  "category": "String (Theft/Medical/Accident)",
  "riskScore": "Number (0-100)",
  "mediaUrl": "String",
  "status": "String (Pending/Resolved)"
}
```

**GeoZones**
```json
{
  "_id": "ObjectId",
  "name": "String",
  "type": "String (Safe/Red-Zone)",
  "geometry": { "type": "Polygon", "coordinates": [...] }
}
```

---

### SECTION 9 — BLOCKCHAIN DIGITAL ID DESIGN

- **Smart Contract:** `TouristIdentity.sol`
- **Data on Chain:** `keccak256(passportNumber + salt)`, expiryDate, issuerAuthority.
- **Wallet Strategy:** Custodial fragments (Mnemonic stored in backend env or AWS KMS).
- **Gas Costs:** Optimization via Polygon (MATIC) ensuring txn cost < $0.05.
- **Integration:** Ethers.js using `Contract` instance and `JsonRpcProvider`.

---

### SECTION 10 — AI SYSTEM DESIGN (Gemini)

- **Chatbot:** Uses Gemini Pro for context-aware safety conversations.
- **Report Analysis:** Gemini Flash analyzes incident photos to identify weapons/injuries automatically.
- **Risk Scoring:** Prompt: *"Evaluate this incident: {text}. Rate risk 1-10 and suggest immediate action."*
- **Unsafe Zone Detection:** Feeding crime data text patterns to Gemini to identify emerging "hotspots".

---

### SECTION 11 — GEO-FENCING ENGINE DESIGN

**Algorithm:** Ray-casting or Winding Number for Point-in-Polygon.
**Pseudocode:**
```javascript
function checkProximity(userPos, zones) {
  for (let zone of zones) {
    if (isPointInPolygon(userPos, zone.geometry)) {
      if (zone.type === 'Red-Zone') triggerSOS(userPos);
      else return zone.status;
    }
  }
}
```

---

### SECTION 12 — REAL-TIME ALERT SYSTEM

- **Event:** `locationUpdate` -> Streams lat/lng every 30s.
- **Event:** `emergencySOS` -> High priority event; bypasses standard queues.
- **Admin Push:** Socket broadcast to all connected dashboard clients.

---

### SECTION 13 — ADMIN DASHBOARD DESIGN

- **Components:** `MapboxGL`, `EmergencyLogTable`, `TouristAnalyticsChart`.
- **Data Fetching:** React Query for polling status, Sockets for live pins.

---

### SECTION 14 — SECURITY DESIGN

- **Authentication:** JWT with HTTP-only cookies.
- **Validation:** Joi/Zod for all incoming API payloads.
- **Encryption:** bcrypt for passwords; AES for PII at rest.
- **Rate Limiting:** IP-based throttles for auth and SOS endpoints.

---

### SECTION 15 — SCALABILITY DESIGN

- **Horizontal Scaling:** Stateless Node.js containers.
- **Load Balancing:** Nginx/ALB.
- **Caching:** Redis for rapid location lookups.
- **Database Indexing:** Geospatial indexes (`2dsphere`) on `currentLocation`.

---

### SECTION 16 — SYSTEM FOLDER STRUCTURE

```text
/backend
  /src
    /controllers
    /routes
    /services
    /models
    /middleware
    /blockchain
/mobile
  /src
    /screens
    /components
    /services
    /navigation
/admin-dashboard
  /src
    /components
    /pages
    /services
```

---

### SECTION 17 — API SPECIFICATION

- **POST `/api/auth/register`**: Register new tourist & create blockchain ID.
- **POST `/api/location/update`**: Send current GPS coordinates.
- **POST `/api/sos`**: Trigger immediate emergency alert.
- **POST `/api/incidents`**: Report a safety incident with media.

---

### SECTION 18 — DEPLOYMENT ARCHITECTURE

- **Docker:** Multi-stage builds for backend and dashboard.
- **Infrastructure:** AWS (ECS, RDS for Mongo, S3).
- **Blockchain Node:** Infura/Alchemy for Ethereum/Polygon access.

---

### SECTION 19 — RISK ANALYSIS

| Risk | Mitigation |
| :--- | :--- |
| GPS Inaccuracy | Use breadcrumb smoothing and OS-level location accuracy settings. |
| AI Hallucination | Fallback to human dispatcher for critical SOS triage. |
| Server Overload | Implement auto-scaling groups based on CPU/Memory usage. |

---

### SECTION 20 — FUTURE EXTENSIONS

- Smart city sensor integration.
- Drones for rapid inspection of SOS locations.
- Wearable panic devices for non-phone users.

---
*Created by Antigravity AI Engineering*
