// ====================================================
// SMART HEALTH RECORD - BACKEND SERVER
// Node.js + Express + MongoDB Atlas
// ====================================================

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// ====================================================
// MIDDLEWARE
// ====================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ====================================================
// MONGODB CONNECTION
// ====================================================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file!');
  console.error('👉 Copy .env.example to .env and fill in your MongoDB Atlas URI');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ====================================================
// DATABASE MODELS
// ====================================================

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  domain:   { type: String, required: true },
  hospital: { type: String, required: true },
  doctorId: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

// Patient Schema
const patientSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  patientId: { type: String, required: true, unique: true },
  phone:     { type: String, default: '' },
  gender:    { type: String, default: '' },
  blood:     { type: String, default: '' },
  height:    { type: String, default: '' },
  weight:    { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  patientId:   { type: String, required: true },
  patientName: { type: String, default: '' },
  doctorId:    { type: String, required: true },
  doctorName:  { type: String, default: '' },
  domain:      { type: String, default: '' },
  hospital:    { type: String, default: '' },
  date:        { type: String, required: true },
  time:        { type: String, required: true },
  status:      { type: String, default: 'scheduled' },
  createdAt:   { type: Date, default: Date.now }
});

const Doctor      = mongoose.model('Doctor', doctorSchema);
const Patient     = mongoose.model('Patient', patientSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// ====================================================
// DOCTOR ROUTES
// ====================================================

// POST /api/doctors/signup
app.post('/api/doctors/signup', async (req, res) => {
  try {
    const { name, email, password, domain, hospital, doctorId } = req.body;

    if (!name || !email || !password || !domain || !hospital || !doctorId) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await Doctor.findOne({ $or: [{ email: email.toLowerCase() }, { doctorId }] });
    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(409).json({ error: 'Doctor ID already taken' });
    }

    const doctor = new Doctor({ name, email, password, domain, hospital, doctorId });
    await doctor.save();

    res.status(201).json({
      message: 'Doctor registered successfully',
      doctor: { id: doctor._id, name: doctor.name, email: doctor.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/doctors/login
app.post('/api/doctors/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase() });
    if (!doctor || doctor.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      doctor: {
        id:       doctor._id,
        name:     doctor.name,
        email:    doctor.email,
        domain:   doctor.domain,
        hospital: doctor.hospital,
        doctorId: doctor.doctorId
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/doctors?domain=Cardiology  — filter by domain (query string)
// GET /api/doctors                    — all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const { domain } = req.query;
    const filter = domain ? { domain } : {};
    const doctors = await Doctor.find(filter).sort({ name: 1 });

    res.json({
      domain: domain || 'all',
      count:  doctors.length,
      doctors: doctors.map(d => ({
        id:       d._id,
        name:     d.name,
        domain:   d.domain,
        hospital: d.hospital,
        doctorId: d.doctorId
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/doctors/:domain  — legacy route kept for backwards compatibility
app.get('/api/doctors/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const doctors = await Doctor.find({ domain }).sort({ name: 1 });

    res.json({
      domain,
      count:  doctors.length,
      doctors: doctors.map(d => ({
        id:       d._id,
        name:     d.name,
        domain:   d.domain,
        hospital: d.hospital,
        doctorId: d.doctorId
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/doctors/:doctorId/appointments — appointments for a specific doctor
app.get('/api/doctors/:doctorId/appointments', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointments = await Appointment.find({ doctorId }).sort({ createdAt: -1 });

    res.json({
      count: appointments.length,
      appointments: appointments.map(a => ({
        id:          a._id,
        patientId:   a.patientId,
        patientName: a.patientName,
        date:        a.date,
        time:        a.time,
        status:      a.status
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// PATIENT ROUTES
// ====================================================

// POST /api/patients/signup
app.post('/api/patients/signup', async (req, res) => {
  try {
    const { name, email, password, phone, gender, blood, height, weight } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await Patient.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const patient = new Patient({
      name,
      email,
      password,
      phone:     phone  || '',
      gender:    gender || '',
      blood:     blood  || '',
      height:    height || '',
      weight:    weight || '',
      patientId: `P-${Date.now()}`
    });

    await patient.save();

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: { id: patient._id, name: patient.name, email: patient.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patients/login
app.post('/api/patients/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (!patient || patient.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      patient: {
        id:        patient._id,
        name:      patient.name,
        email:     patient.email,
        patientId: patient.patientId,
        phone:     patient.phone,
        gender:    patient.gender,
        blood:     patient.blood,
        height:    patient.height,
        weight:    patient.weight
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// APPOINTMENT ROUTES
// ====================================================

// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
  try {
    const { patientId, doctorId, date, time } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ error: 'patientId, doctorId, date, and time are required' });
    }

    const doctor  = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const patient = await Patient.findById(patientId);

    const appointment = new Appointment({
      patientId,
      patientName: patient ? patient.name : '',
      doctorId,
      doctorName:  doctor.name,
      domain:      doctor.domain,
      hospital:    doctor.hospital,
      date,
      time,
      status: 'scheduled'
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        id:          appointment._id,
        doctorName:  appointment.doctorName,
        domain:      appointment.domain,
        hospital:    appointment.hospital,
        date:        appointment.date,
        time:        appointment.time,
        status:      appointment.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:patientId/appointments
app.get('/api/patients/:patientId/appointments', async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });

    res.json({
      count: appointments.length,
      appointments: appointments.map(a => ({
        id:         a._id,
        doctorName: a.doctorName,
        domain:     a.domain,
        hospital:   a.hospital,
        date:       a.date,
        time:       a.time,
        status:     a.status
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// HEALTH CHECK
// ====================================================
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    message:   'Smart Health Record API is running',
    db:        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ====================================================
// SERVE FRONTEND (must be last)
// ====================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ====================================================
// START SERVER
// ====================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
});
