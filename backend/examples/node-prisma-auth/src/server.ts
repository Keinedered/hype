import express from 'express';
import cors from 'cors';
import { authRouter } from './auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRouter);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Auth API is running on http://localhost:${port}`);
});
