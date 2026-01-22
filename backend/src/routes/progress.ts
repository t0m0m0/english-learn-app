import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateNextReview } from '../services/spaced-repetition';

const router = Router();

// Get user's progress
router.get('/user/:userId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const userId = parseInt(req.params.userId);

  try {
    const progress = await prisma.progress.findMany({
      where: { userId },
      include: { word: true },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate statistics
    const totalWords = await prisma.word.count();
    const learnedWords = progress.filter(p => p.level > 0).length;
    const masteredWords = progress.filter(p => p.level >= 4).length;

    res.json({
      progress,
      statistics: {
        totalWords,
        learnedWords,
        masteredWords,
        progressPercent: Math.round((learnedWords / totalWords) * 100),
        masteryPercent: Math.round((masteredWords / totalWords) * 100),
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get words due for review (spaced repetition)
router.get('/review/:userId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const userId = parseInt(req.params.userId);
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const now = new Date();

    // Get words that are due for review
    const dueWords = await prisma.progress.findMany({
      where: {
        userId,
        nextReview: {
          lte: now,
        },
      },
      include: { word: true },
      orderBy: { nextReview: 'asc' },
      take: limit,
    });

    res.json({ words: dueWords });
  } catch (error) {
    console.error('Error fetching review words:', error);
    res.status(500).json({ error: 'Failed to fetch review words' });
  }
});

// Get new words to learn (not yet in progress)
router.get('/new/:userId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const userId = parseInt(req.params.userId);
  const limit = parseInt(req.query.limit as string) || 10;
  const maxFrequency = parseInt(req.query.maxFrequency as string) || 1000;

  try {
    // Get words that user hasn't learned yet
    const learnedWordIds = await prisma.progress.findMany({
      where: { userId },
      select: { wordId: true },
    });

    const learnedIds = learnedWordIds.map(p => p.wordId);

    const newWords = await prisma.word.findMany({
      where: {
        id: { notIn: learnedIds.length > 0 ? learnedIds : [-1] },
        frequency: { lte: maxFrequency },
      },
      orderBy: { frequency: 'asc' },
      take: limit,
    });

    res.json({ words: newWords });
  } catch (error) {
    console.error('Error fetching new words:', error);
    res.status(500).json({ error: 'Failed to fetch new words' });
  }
});

// Update progress after review
router.post('/update', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { userId, wordId, correct } = req.body;

  if (!userId || !wordId || correct === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get or create progress
    let progress = await prisma.progress.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    const now = new Date();
    let newLevel: number;
    let nextReview: Date;

    if (progress) {
      // Update existing progress
      newLevel = correct
        ? Math.min(progress.level + 1, 5)
        : Math.max(progress.level - 1, 0);
      nextReview = calculateNextReview(newLevel);

      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: {
          level: newLevel,
          lastReviewed: now,
          nextReview,
          reviewCount: { increment: 1 },
          correctCount: correct ? { increment: 1 } : undefined,
        },
      });
    } else {
      // Create new progress
      newLevel = correct ? 1 : 0;
      nextReview = calculateNextReview(newLevel);

      progress = await prisma.progress.create({
        data: {
          userId,
          wordId,
          level: newLevel,
          lastReviewed: now,
          nextReview,
          reviewCount: 1,
          correctCount: correct ? 1 : 0,
        },
      });
    }

    res.json({ progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get daily statistics
router.get('/stats/:userId', async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const userId = parseInt(req.params.userId);

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Words reviewed today
    const todayReviews = await prisma.progress.count({
      where: {
        userId,
        lastReviewed: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Total progress
    const totalProgress = await prisma.progress.aggregate({
      where: { userId },
      _count: true,
      _avg: { level: true },
    });

    // Words by level
    const levelDistribution = await prisma.progress.groupBy({
      by: ['level'],
      where: { userId },
      _count: true,
    });

    res.json({
      todayReviews,
      totalLearned: totalProgress._count,
      averageLevel: totalProgress._avg.level || 0,
      levelDistribution,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
