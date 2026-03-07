import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import visaRoutes from './routes/visaRoutes.js';
import identityRoutes from './routes/identityRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import placeRoutes from './routes/placeRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import { seedPlaces } from './controllers/placeController.js';
import { seedHotels } from './controllers/hotelController.js';
import geoRoutes from './routes/geoRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/geo', geoRoutes);

// Seed default data
seedPlaces();
seedHotels();

export default app;
