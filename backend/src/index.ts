import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config';
import roomsRouter from './routes/rooms';
import plansRouter from './routes/plans';
import amenitiesRouter from './routes/amenities';
import accountRouter from './routes/account';
import bookingRouter from './routes/booking';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/rooms', roomsRouter);
app.use('/api/plans', plansRouter);
app.use('/api/amenities', amenitiesRouter);
app.use('/api/account', accountRouter);
app.use('/api/booking', bookingRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
