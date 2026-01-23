import express from 'express';
import cors from 'cors';
import wordsRouter from './routes/words';
import progressRouter from './routes/progress';
import usersRouter from './routes/users';

export function createApp(prisma?: unknown) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Make prisma available to routes
  if (prisma) {
    app.locals.prisma = prisma;
  }

  // Routes
  app.use('/api/words', wordsRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/users', usersRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  return app;
}
