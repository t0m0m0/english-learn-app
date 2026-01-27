import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QAItemData {
  question: string;
  answer: string;
}

interface LessonData {
  lesson: number;
  title: string;
  description: string;
  qaItems: QAItemData[];
}

interface StageData {
  stage: number;
  title: string;
  description: string;
  lessons: LessonData[];
}

interface CallanData {
  stages: StageData[];
}

async function main() {
  console.log('Starting Callan Q&A data seed...');

  // Read Callan Q&A data
  const dataPath = path.join(__dirname, 'data/callan-qa-data.json');
  const content = fs.readFileSync(dataPath, 'utf-8');
  const data: CallanData = JSON.parse(content);

  // Default user ID (created in the main seed script)
  const DEFAULT_USER_ID = 1;

  // Check if default user exists
  const user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!user) {
    console.error('Default user (ID=1) not found. Please run the main seed script first.');
    process.exit(1);
  }

  // Delete existing Callan lessons for the default user (to allow re-seeding)
  console.log('Deleting existing Callan lessons for default user...');
  await prisma.lesson.deleteMany({
    where: {
      userId: DEFAULT_USER_ID,
      title: {
        startsWith: 'Stage',
      },
    },
  });

  let lessonOrder = 1;
  let totalQAItems = 0;

  for (const stage of data.stages) {
    console.log(`Processing ${stage.title}...`);

    for (const lesson of stage.lessons) {
      // Create lesson
      const createdLesson = await prisma.lesson.create({
        data: {
          title: lesson.title,
          description: lesson.description,
          order: lessonOrder,
          userId: DEFAULT_USER_ID,
        },
      });

      // Create QA items for this lesson
      let qaOrder = 1;
      for (const qaItem of lesson.qaItems) {
        await prisma.qAItem.create({
          data: {
            question: qaItem.question,
            answer: qaItem.answer,
            order: qaOrder,
            lessonId: createdLesson.id,
          },
        });
        qaOrder++;
        totalQAItems++;
      }

      console.log(`  Created lesson: ${lesson.title} with ${lesson.qaItems.length} QA items`);
      lessonOrder++;
    }
  }

  console.log(`\nSeed completed successfully!`);
  console.log(`Total lessons created: ${lessonOrder - 1}`);
  console.log(`Total QA items created: ${totalQAItems}`);
}

main()
  .catch((e) => {
    console.error('Callan Q&A seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
