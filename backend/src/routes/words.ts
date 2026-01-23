import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Helper function to parse and validate positive integers
function parsePositiveInt(value: string | undefined, defaultValue: number, max?: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  if (isNaN(parsed) || parsed < 1) return defaultValue;
  if (max && parsed > max) return max;
  return parsed;
}

// Get all words with pagination
router.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const page = parsePositiveInt(req.query.page as string, 1);
  const limit = parsePositiveInt(req.query.limit as string, 20, 100);
  const skip = (page - 1) * limit;

  try {
    const [words, total] = await Promise.all([
      prisma.word.findMany({
        skip,
        take: limit,
        orderBy: { frequency: 'asc' },
      }),
      prisma.word.count(),
    ]);

    res.json({
      words,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Get words by frequency range (for Lonsdale's core principle)
// 1-1000: covers 85% of daily conversation
// 1-3000: covers 98% of daily conversation
router.get('/range/:start/:end', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const start = parseInt(req.params.start);
  const end = parseInt(req.params.end);

  if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
    return res.status(400).json({ error: 'Invalid range parameters. Must be positive integers.' });
  }
  if (start > end) {
    return res.status(400).json({ error: 'Start must be less than or equal to end.' });
  }

  try {
    const words = await prisma.word.findMany({
      where: {
        frequency: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { frequency: 'asc' },
    });

    res.json({ words, count: words.length });
  } catch (error) {
    console.error('Error fetching words by range:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Get random words for practice
router.get('/random', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const count = parsePositiveInt(req.query.count as string, 10, 100);
  const maxFrequency = parsePositiveInt(req.query.maxFrequency as string, 3000);

  try {
    // Get random words using raw query for better randomness
    const words = await prisma.$queryRaw`
      SELECT * FROM "Word"
      WHERE frequency <= ${maxFrequency}
      ORDER BY RANDOM()
      LIMIT ${count}
    `;

    res.json({ words });
  } catch (error) {
    console.error('Error fetching random words:', error);
    res.status(500).json({ error: 'Failed to fetch random words' });
  }
});

// Get words by part of speech (for mixing game)
router.get('/pos/:partOfSpeech', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { partOfSpeech } = req.params;
  const count = parsePositiveInt(req.query.count as string, 10, 100);

  try {
    const words = await prisma.$queryRaw`
      SELECT * FROM "Word"
      WHERE "partOfSpeech" = ${partOfSpeech}
      ORDER BY RANDOM()
      LIMIT ${count}
    `;

    res.json({ words });
  } catch (error) {
    console.error('Error fetching words by POS:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Get a single word by id
router.get('/:id', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const id = parseInt(req.params.id);

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid word ID. Must be a positive integer.' });
  }

  try {
    const word = await prisma.word.findUnique({
      where: { id },
    });

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json({ word });
  } catch (error) {
    console.error('Error fetching word:', error);
    res.status(500).json({ error: 'Failed to fetch word' });
  }
});

// Search words
router.get('/search/:query', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { query } = req.params;

  try {
    const words = await prisma.word.findMany({
      where: {
        word: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 20,
      orderBy: { frequency: 'asc' },
    });

    res.json({ words });
  } catch (error) {
    console.error('Error searching words:', error);
    res.status(500).json({ error: 'Failed to search words' });
  }
});

export default router;
