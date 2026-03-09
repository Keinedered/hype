import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const authRouter = express.Router();

interface SignUpBody {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

interface LogInBody {
  email: string;
  password: string;
}

interface JwtPayload {
  sub: string;
  email: string;
}

function createAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

authRouter.post('/sign-up', async (req, res) => {
  const { username, email, password, fullName } = req.body as SignUpBody;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email and password are required' });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      fullName,
    },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      createdAt: true,
    },
  });

  return res.status(201).json(user);
});

authRouter.post('/log-in', async (req, res) => {
  const { email, password } = req.body as LogInBody;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = createAccessToken({ sub: user.id, email: user.email });

  return res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    },
  });
});

authRouter.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.slice('Bearer '.length);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

export { authRouter };
