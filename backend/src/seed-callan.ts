import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import type { CallanData } from './types/callan-data';

const prisma = new PrismaClient();

// Callan lesson title pattern: "Stage X - Lesson Y: ..."
const CALLAN_LESSON_PATTERN = /^Stage \d+ - Lesson \d+:/;

function validateCallanData(data: unknown): CallanData {
  if (!data || typeof data !== 'object') {
    throw new Error('Data file must contain a JSON object');
  }

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.stages)) {
    throw new Error('Data file must contain a "stages" array');
  }

  if (obj.stages.length === 0) {
    throw new Error('Data file contains no stages - nothing to seed');
  }

  for (let i = 0; i < obj.stages.length; i++) {
    const stage = obj.stages[i] as Record<string, unknown>;
    if (!stage.title || !Array.isArray(stage.lessons)) {
      throw new Error(`Stage ${i + 1} is missing required properties (title, lessons)`);
    }
    if (stage.lessons.length === 0) {
      throw new Error(`Stage "${stage.title}" contains no lessons`);
    }
    for (let j = 0; j < stage.lessons.length; j++) {
      const lesson = stage.lessons[j] as Record<string, unknown>;
      if (!lesson.title || !Array.isArray(lesson.qaItems)) {
        throw new Error(`Lesson ${j + 1} in stage "${stage.title}" is missing required properties`);
      }
      if (lesson.qaItems.length === 0) {
        throw new Error(`Lesson "${lesson.title}" contains no QA items`);
      }
    }
  }

  return obj as unknown as CallanData;
}

async function main() {
  console.log('Starting Callan Q&A data seed...');

  const dataPath = path.join(__dirname, 'data/callan-qa-data.json');

  let content: string;
  try {
    content = fs.readFileSync(dataPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`Data file not found at: ${dataPath}`);
      console.error('Please ensure callan-qa-data.json exists in the data directory.');
    } else {
      console.error(`Failed to read data file: ${(err as Error).message}`);
    }
    process.exit(1);
  }

  let data: CallanData;
  try {
    const parsed = JSON.parse(content);
    data = validateCallanData(parsed);
  } catch (err) {
    console.error(`Invalid data file: ${(err as Error).message}`);
    process.exit(1);
  }

  // Default user ID (created in the main seed script - see seed.ts)
  const DEFAULT_USER_ID = 1;

  const user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!user) {
    console.error('Default user (ID=1) not found. Please run the main seed script first.');
    process.exit(1);
  }

  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Delete only Callan lessons (matching exact pattern "Stage X - Lesson Y:")
    const existingLessons = await tx.lesson.findMany({
      where: { userId: DEFAULT_USER_ID },
      select: { id: true, title: true },
    });

    const callanLessonIds = existingLessons
      .filter((l) => CALLAN_LESSON_PATTERN.test(l.title))
      .map((l) => l.id);

    if (callanLessonIds.length > 0) {
      console.log(`Deleting ${callanLessonIds.length} existing Callan lessons...`);
      await tx.lesson.deleteMany({
        where: { id: { in: callanLessonIds } },
      });
    }

    let lessonOrder = 1;
    let totalQAItems = 0;

    for (const stage of data.stages) {
      console.log(`Processing ${stage.title}...`);

      for (const lesson of stage.lessons) {
        const createdLesson = await tx.lesson.create({
          data: {
            title: lesson.title,
            description: lesson.description,
            order: lessonOrder,
            userId: DEFAULT_USER_ID,
          },
        });

        // Batch insert QA items
        const qaItemsData = lesson.qaItems.map((qaItem, index) => ({
          question: qaItem.question,
          answer: qaItem.answer,
          order: index + 1,
          lessonId: createdLesson.id,
        }));

        await tx.qAItem.createMany({ data: qaItemsData });
        totalQAItems += lesson.qaItems.length;

        console.log(`  Created lesson: ${lesson.title} with ${lesson.qaItems.length} QA items`);
        lessonOrder++;
      }
    }

    return { lessonCount: lessonOrder - 1, qaItemCount: totalQAItems };
  });

  console.log(`\nSeed completed successfully!`);
  console.log(`Total lessons created: ${result.lessonCount}`);
  console.log(`Total QA items created: ${result.qaItemCount}`);
}

main()
  .catch((e) => {
    console.error('Callan Q&A seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
  });
