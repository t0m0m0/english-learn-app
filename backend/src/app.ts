import express from 'express';
import cors from 'cors';
import { Prisma } from '@prisma/client';
import wordsRouter from './routes/words';
import progressRouter from './routes/progress';
import lessonsRouter from './routes/lessons';
import qaItemsRouter from './routes/qa-items';
import callanProgressRouter from './routes/callan-progress';

export function createApp(prisma?: unknown) {
  const app = express();

  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json());

  // Make prisma available to routes
  if (prisma) {
    app.locals.prisma = prisma;
  }

  // Health check (doesn't require database)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Prisma availability check middleware for API routes
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') {
      return next();
    }
    if (!req.app.locals.prisma) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'DB_NOT_INITIALIZED',
      });
    }
    next();
  });

  // Routes
  app.use('/api/words', wordsRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/lessons', lessonsRouter);
  app.use('/api/qa-items', qaItemsRouter);
  app.use('/api/callan/progress', callanProgressRouter);

  // Error handling
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const errorId = Date.now().toString(36);
    console.error(`[ErrorID: ${errorId}] ${err.name}: ${err.message}`, err.stack);

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Resource not found', errorId });
      }
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Resource already exists', errorId });
      }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({ error: 'Invalid request parameters', errorId });
    }

    res.status(500).json({
      error: 'An internal error occurred. Please try again.',
      errorId,
    });
  });

  return app;
}
