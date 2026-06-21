# 🏥 Smart Health Record System

A full-stack health record and appointment booking system built with **Node.js**, **Express**, and **MongoDB Atlas**. Runs on Replit or any Node.js environment with zero manual setup beyond adding your MongoDB URI.

---

## ✨ Features

- **Doctor accounts** — Register with specialization, hospital name, and unique Doctor ID
- **Patient accounts** — Full health profile (blood group, height, weight, gender, phone)
- **Appointment booking** — Patients browse doctors by specialty, see live data from the database, and book appointments
- **Doctor appointments view** — Doctors see all appointments booked with them
- **No localStorage / sessionStorage** — All data lives in MongoDB; session state is held in memory only
- **REST API** — Clean, documented endpoints for auth, doctors, patients, and appointments

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/smart-health-record.git
cd smart-health-record
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and replace the placeholder with your **MongoDB Atlas** connection string.

> **MongoDB Atlas (free):** [https://mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)  
> Create a free M0 cluster → Connect → Drivers → copy the URI.

### 4. Start the server
```bash
npm start
```

Visit **http://localhost:3000**

---

## 🔁 Running on Replit

1. Import the repo into Replit (New Repl → Import from GitHub)
2. Add `MONGO_URI` in **Replit Secrets** (the padlock icon in the sidebar)
3. Click **Run** — Replit uses `npm start` automatically

---

## 📁 Project Structure

```
smart-health-record/
├── public/
│   └── index.html        # Single-page frontend (HTML + CSS + JS)
├── server.js             # Express backend + Mongoose models + REST API
├── package.json
├── .env.example          # Copy to .env and fill in your MONGO_URI
├── .gitignore
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctors/signup` | Register a doctor |
| POST | `/api/doctors/login` | Doctor login |
| POST | `/api/patients/signup` | Register a patient |
| POST | `/api/patients/login` | Patient login |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | All doctors |
| GET | `/api/doctors?domain=Cardiology` | Filter by specialization |
| GET | `/api/doctors/:doctorId/appointments` | Appointments for a doctor |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book an appointment |
| GET | `/api/patients/:patientId/appointments` | Patient's appointments |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server + DB status |

---

## 🗄️ Database Collections

### `doctors`
| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | unique |
| password | String | plain text (hash in production) |
| domain | String | Cardiology, Neurology, etc. |
| hospital | String | Hospital name |
| doctorId | String | unique, e.g. D-001 |

### `patients`
| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | unique |
| password | String | |
| patientId | String | auto-generated P-{timestamp} |
| phone, gender, blood, height, weight | String | optional profile fields |

### `appointments`
| Field | Type | Notes |
|-------|------|-------|
| patientId | String | references patient _id |
| patientName | String | denormalized for display |
| doctorId | String | references doctor _id |
| doctorName, domain, hospital | String | denormalized |
| date, time | String | |
| status | String | default: "scheduled" |

---

## ⚠️ Production Notes

- **Passwords** are stored in plain text in this demo. Use **bcrypt** before going live.
- Add **JWT** or session tokens for proper stateless authentication.
- Enable **MongoDB Atlas IP whitelist** and use environment secrets, never commit `.env`.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript (single file, no build step)
- **Backend:** Node.js + Express
- **Database:** MongoDB via Mongoose
- **Hosting:** Replit / any Node.js host (Railway, Render, Fly.io, etc.)
