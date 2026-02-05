import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ItemData {
  type: string;
  audioPath: string;
  sentence: string;
  blank?: string;
  blankIndex?: number;
  explanation?: string;
}

interface ExerciseData {
  title: string;
  difficulty: string;
  items: ItemData[];
}

interface CategoryData {
  name: string;
  nameJa: string;
  slug: string;
  description: string;
  exercises: ExerciseData[];
}

interface SoundChangeData {
  categories: CategoryData[];
}

const validDifficulties = ['beginner', 'intermediate', 'advanced'];
const validTypes = ['fill_blank', 'dictation'];

function validateData(data: unknown): SoundChangeData {
  if (!data || typeof data !== 'object') {
    throw new Error('Data file must contain a JSON object');
  }

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.categories)) {
    throw new Error('Data file must contain a "categories" array');
  }

  if (obj.categories.length === 0) {
    throw new Error('Data file contains no categories - nothing to seed');
  }

  for (let i = 0; i < obj.categories.length; i++) {
    const category = obj.categories[i] as Record<string, unknown>;
    if (!category.name || !category.nameJa || !category.slug) {
      throw new Error(`Category ${i + 1} is missing required properties (name, nameJa, slug)`);
    }
    if (!Array.isArray(category.exercises) || category.exercises.length === 0) {
      throw new Error(`Category "${category.name}" must have at least one exercise`);
    }

    for (let j = 0; j < (category.exercises as ExerciseData[]).length; j++) {
      const exercise = (category.exercises as ExerciseData[])[j];
      if (!exercise.title || !exercise.difficulty) {
        throw new Error(`Exercise ${j + 1} in "${category.name}" is missing required properties`);
      }
      if (!validDifficulties.includes(exercise.difficulty)) {
        throw new Error(`Exercise "${exercise.title}" has invalid difficulty "${exercise.difficulty}"`);
      }
      if (!Array.isArray(exercise.items) || exercise.items.length === 0) {
        throw new Error(`Exercise "${exercise.title}" must have at least one item`);
      }

      for (let k = 0; k < exercise.items.length; k++) {
        const item = exercise.items[k];
        if (!validTypes.includes(item.type)) {
          throw new Error(`Item ${k + 1} in "${exercise.title}" has invalid type "${item.type}"`);
        }
        if (!item.audioPath || !item.sentence) {
          throw new Error(`Item ${k + 1} in "${exercise.title}" is missing audioPath or sentence`);
        }
        if (item.type === 'fill_blank' && (!item.blank || item.blankIndex === undefined)) {
          throw new Error(`Fill-blank item ${k + 1} in "${exercise.title}" is missing blank or blankIndex`);
        }
      }
    }
  }

  return obj as unknown as SoundChangeData;
}

async function main() {
  console.log('Starting sound changes seed...');

  const dataPath = path.join(__dirname, 'data/sound-changes.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found: ${dataPath}`);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const data = validateData(rawData);

  await prisma.$transaction(async (tx) => {
    // Delete existing data in dependency order
    await tx.soundChangeProgress.deleteMany();
    await tx.soundChangeExerciseItem.deleteMany();
    await tx.soundChangeExercise.deleteMany();
    await tx.soundChangeCategory.deleteMany();

    let totalCategories = 0;
    let totalExercises = 0;
    let totalItems = 0;

    for (let i = 0; i < data.categories.length; i++) {
      const catData = data.categories[i];

      const category = await tx.soundChangeCategory.create({
        data: {
          name: catData.name,
          nameJa: catData.nameJa,
          slug: catData.slug,
          description: catData.description || null,
          order: i + 1,
        },
      });

      for (let j = 0; j < catData.exercises.length; j++) {
        const exData = catData.exercises[j];

        const exercise = await tx.soundChangeExercise.create({
          data: {
            categoryId: category.id,
            title: exData.title,
            difficulty: exData.difficulty,
            order: j + 1,
          },
        });

        await tx.soundChangeExerciseItem.createMany({
          data: exData.items.map((item, k) => ({
            exerciseId: exercise.id,
            type: item.type,
            audioPath: item.audioPath,
            sentence: item.sentence,
            blank: item.blank || null,
            blankIndex: item.blankIndex ?? null,
            explanation: item.explanation || null,
            order: k + 1,
          })),
        });

        totalItems += exData.items.length;
        totalExercises++;
        console.log(`  Created exercise: ${exData.title} (${catData.name}, ${exData.difficulty}) with ${exData.items.length} items`);
      }

      totalCategories++;
    }

    console.log(`\nSeed completed successfully!`);
    console.log(`Total categories: ${totalCategories}`);
    console.log(`Total exercises: ${totalExercises}`);
    console.log(`Total items: ${totalItems}`);
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
