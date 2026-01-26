import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

type PrismaLike = Pick<PrismaClient, 'callanProgress' | 'qAItem' | 'lesson'>;

const VALID_MODES = ['qa', 'shadowing', 'dictation'] as const;
type Mode = typeof VALID_MODES[number];

// POST /api/callan/progress - Record practice result
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { userId, qaItemId, mode, isCorrect } = req.body;

    // Validation
    if (typeof userId !== 'number' || !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'userId must be an integer' });
    }

    if (typeof qaItemId !== 'string' || !qaItemId.trim()) {
      return res.status(400).json({ error: 'qaItemId is required' });
    }

    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: `mode must be one of: ${VALID_MODES.join(', ')}` });
    }

    if (typeof isCorrect !== 'boolean') {
      return res.status(400).json({ error: 'isCorrect must be a boolean' });
    }

    // Check if QA item exists
    const qaItem = await prisma.qAItem.findUnique({
      where: { id: qaItemId },
    });

    if (!qaItem) {
      return res.status(404).json({ error: 'QA item not found' });
    }

    // Check for existing progress
    const existingProgress = await prisma.callanProgress.findUnique({
      where: {
        userId_qaItemId_mode: {
          userId,
          qaItemId,
          mode,
        },
      },
    });

    let progress;

    if (existingProgress) {
      // Update existing progress
      progress = await prisma.callanProgress.update({
        where: { id: existingProgress.id },
        data: {
          correctCount: existingProgress.correctCount + (isCorrect ? 1 : 0),
          totalCount: existingProgress.totalCount + 1,
          lastPracticed: new Date(),
        },
      });
    } else {
      // Create new progress
      progress = await prisma.callanProgress.create({
        data: {
          userId,
          qaItemId,
          mode,
          correctCount: isCorrect ? 1 : 0,
          totalCount: 1,
          lastPracticed: new Date(),
        },
      });
    }

    res.json({ progress });
  } catch (error) {
    next(error);
  }
});

// GET /api/callan/progress/summary - Get progress summary for a user
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const userId = parseInt(req.query.userId as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    // Get all lessons with their QA items
    const lessons = await prisma.lesson.findMany({
      where: { userId },
      include: { qaItems: true },
    });

    // Get all progress for the user
    const allProgress = await prisma.callanProgress.findMany({
      where: { userId },
    });

    // Calculate totals
    const totalLessons = lessons.length;
    const totalQAItems = lessons.reduce((sum, lesson) => sum + lesson.qaItems.length, 0);

    // Calculate practiced QA items (unique qaItemIds)
    const practicedQAItemIds = new Set(allProgress.map(p => p.qaItemId));
    const practicedQAItems = practicedQAItemIds.size;

    // Calculate by mode
    const byMode = {
      qa: { total: 0, correct: 0, accuracy: 0 },
      shadowing: { total: 0, practiced: 0 },
      dictation: { total: 0, correct: 0, accuracy: 0 },
    };

    allProgress.forEach(p => {
      if (p.mode === 'qa') {
        byMode.qa.total += p.totalCount;
        byMode.qa.correct += p.correctCount;
      } else if (p.mode === 'shadowing') {
        byMode.shadowing.total += p.totalCount;
        byMode.shadowing.practiced += p.totalCount;
      } else if (p.mode === 'dictation') {
        byMode.dictation.total += p.totalCount;
        byMode.dictation.correct += p.correctCount;
      }
    });

    // Calculate accuracy percentages
    if (byMode.qa.total > 0) {
      byMode.qa.accuracy = Math.round((byMode.qa.correct / byMode.qa.total) * 100);
    }
    if (byMode.dictation.total > 0) {
      byMode.dictation.accuracy = Math.round((byMode.dictation.correct / byMode.dictation.total) * 100);
    }

    // Calculate completed lessons
    // A lesson is complete if all QA items have been practiced with required accuracy
    let completedLessons = 0;
    for (const lesson of lessons) {
      const lessonQAIds = new Set(lesson.qaItems.map(qa => qa.id));
      const lessonProgress = allProgress.filter(p => lessonQAIds.has(p.qaItemId));
      
      // Check if all QA items have been practiced in at least one mode
      const practicedInLesson = new Set(lessonProgress.map(p => p.qaItemId));
      if (practicedInLesson.size === lesson.qaItems.length && lesson.qaItems.length > 0) {
        completedLessons++;
      }
    }

    // Calculate streak days
    const streakDays = calculateStreakDays(allProgress);

    res.json({
      totalLessons,
      completedLessons,
      totalQAItems,
      practicedQAItems,
      byMode,
      streakDays,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to format date as YYYY-MM-DD for consistent comparison
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to calculate streak days
function calculateStreakDays(progress: { lastPracticed: Date | null }[]): number {
  if (progress.length === 0) return 0;

  // Get unique practice dates (in ISO date format YYYY-MM-DD)
  const practiceDates = progress
    .filter(p => p.lastPracticed)
    .map(p => formatDateString(new Date(p.lastPracticed!)));

  const uniqueDates = [...new Set(practiceDates)].sort().reverse();
  if (uniqueDates.length === 0) return 0;

  // Check if today or yesterday was a practice day
  const today = new Date();
  const todayStr = formatDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  // Count consecutive days
  let streak = 1;
  let currentDate = new Date(today);
  if (uniqueDates[0] === yesterdayStr) {
    currentDate = yesterday;
  }

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDateString(prevDate);

    if (uniqueDates[i] === prevDateStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

// GET /api/callan/progress/:lessonId - Get progress for a lesson
router.get('/:lessonId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.app.locals.prisma as PrismaLike;
    const { lessonId } = req.params;
    const userId = parseInt(req.query.userId as string, 10);
    const mode = req.query.mode as Mode | undefined;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const whereClause: {
      userId: number;
      qaItem: { lessonId: string };
      mode?: Mode;
    } = {
      userId,
      qaItem: { lessonId },
    };

    if (mode && VALID_MODES.includes(mode)) {
      whereClause.mode = mode;
    }

    const progress = await prisma.callanProgress.findMany({
      where: whereClause,
      include: {
        qaItem: true,
      },
      orderBy: {
        qaItem: { order: 'asc' },
      },
    });

    res.json({ progress });
  } catch (error) {
    next(error);
  }
});

export default router;
