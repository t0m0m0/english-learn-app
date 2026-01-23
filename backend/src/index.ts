import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

dotenv.config();

const prisma = new PrismaClient();
const app = createApp(prisma);
const PORT = process.env.PORT || 3001;

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
