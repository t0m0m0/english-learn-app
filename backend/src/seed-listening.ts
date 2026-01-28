import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PassageData {
  title: string;
  text: string;
  difficulty: string;
  topic: string;
  questions: {
    type: string;
    question: string;
    options?: string[];
    answer: string;
  }[];
}

interface ListeningData {
  passages: PassageData[];
}

function validateData(data: unknown): ListeningData {
  if (!data || typeof data !== 'object') {
    throw new Error('Data file must contain a JSON object');
  }

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.passages)) {
    throw new Error('Data file must contain a "passages" array');
  }

  if (obj.passages.length === 0) {
    throw new Error('Data file contains no passages - nothing to seed');
  }

  for (let i = 0; i < obj.passages.length; i++) {
    const passage = obj.passages[i] as Record<string, unknown>;
    if (!passage.title || !passage.text || !passage.difficulty) {
      throw new Error(`Passage ${i + 1} is missing required properties (title, text, difficulty)`);
    }
    if (!Array.isArray(passage.questions) || passage.questions.length === 0) {
      throw new Error(`Passage "${passage.title}" must have at least one question`);
    }
  }

  return obj as unknown as ListeningData;
}

async function main() {
  console.log('Starting listening passages seed...');

  const dataPath = path.join(__dirname, 'data/listening-passages.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found: ${dataPath}`);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const data = validateData(rawData);

  await prisma.$transaction(async (tx) => {
    // Delete existing listening data
    await tx.listeningProgress.deleteMany();
    await tx.listeningQuestion.deleteMany();
    await tx.listeningPassage.deleteMany();

    let totalPassages = 0;
    let totalQuestions = 0;

    for (let i = 0; i < data.passages.length; i++) {
      const passageData = data.passages[i];

      const passage = await tx.listeningPassage.create({
        data: {
          title: passageData.title,
          text: passageData.text,
          difficulty: passageData.difficulty,
          topic: passageData.topic || null,
          order: i + 1,
        },
      });

      await tx.listeningQuestion.createMany({
        data: passageData.questions.map((q, j) => ({
          passageId: passage.id,
          type: q.type,
          question: q.question,
          options: q.options ? JSON.stringify(q.options) : null,
          answer: q.answer,
          order: j + 1,
        })),
      });

      totalQuestions += passageData.questions.length;
      totalPassages++;
      console.log(`  Created passage: ${passageData.title} (${passageData.difficulty}) with ${passageData.questions.length} questions`);
    }

    console.log(`\nSeed completed successfully!`);
    console.log(`Total passages created: ${totalPassages}`);
    console.log(`Total questions created: ${totalQuestions}`);
  });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
