import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Simple part of speech classification based on common patterns
// This is a basic heuristic - in production, you'd use a proper NLP library
function guessPartOfSpeech(word: string): string | null {
  const lowerWord = word.toLowerCase();

  // Common verb endings
  if (lowerWord.endsWith('ate') || lowerWord.endsWith('ize') || lowerWord.endsWith('ify')) {
    return 'verb';
  }

  // Common noun endings
  if (lowerWord.endsWith('tion') || lowerWord.endsWith('ment') || lowerWord.endsWith('ness') ||
      lowerWord.endsWith('ity') || lowerWord.endsWith('ance') || lowerWord.endsWith('ence')) {
    return 'noun';
  }

  // Common adjective endings
  if (lowerWord.endsWith('ful') || lowerWord.endsWith('less') || lowerWord.endsWith('ous') ||
      lowerWord.endsWith('ive') || lowerWord.endsWith('able') || lowerWord.endsWith('ible') ||
      lowerWord.endsWith('al') || lowerWord.endsWith('ical')) {
    return 'adjective';
  }

  // Common adverb ending
  if (lowerWord.endsWith('ly') && !lowerWord.endsWith('ally')) {
    return 'adverb';
  }

  // Common verbs
  const commonVerbs = ['be', 'have', 'do', 'say', 'get', 'make', 'go', 'know', 'take', 'see',
    'come', 'think', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work',
    'seem', 'feel', 'try', 'leave', 'call', 'keep', 'let', 'begin', 'seem', 'help',
    'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'hold', 'bring', 'write',
    'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change',
    'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'spend',
    'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear',
    'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut',
    'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report',
    'decide', 'pull'];

  // Common adjectives
  const commonAdjectives = ['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own',
    'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early',
    'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'best', 'better', 'sure',
    'free', 'strong', 'true', 'whole', 'real', 'full', 'clear', 'easy', 'hard', 'possible',
    'special', 'difficult', 'single', 'white', 'black', 'short', 'open', 'red', 'hot', 'cold',
    'dark', 'light', 'fast', 'slow', 'happy', 'sad', 'angry', 'beautiful', 'ugly', 'rich',
    'poor', 'clean', 'dirty', 'safe', 'dangerous', 'quiet', 'loud', 'soft', 'hard', 'wet', 'dry'];

  // Common nouns
  const commonNouns = ['time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'world',
    'life', 'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'question',
    'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room', 'mother', 'area',
    'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'eye', 'job', 'word',
    'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend', 'father', 'power',
    'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city', 'community', 'name', 'president',
    'team', 'minute', 'idea', 'kid', 'body', 'information', 'back', 'parent', 'face', 'others',
    'level', 'office', 'door', 'health', 'person', 'art', 'war', 'history', 'party', 'result',
    'change', 'morning', 'reason', 'research', 'girl', 'guy', 'moment', 'air', 'teacher', 'force'];

  if (commonVerbs.includes(lowerWord)) return 'verb';
  if (commonAdjectives.includes(lowerWord)) return 'adjective';
  if (commonNouns.includes(lowerWord)) return 'noun';

  return null;
}

async function main() {
  console.log('Starting seed...');

  // Read Oxford 3000 words
  const wordsPath = path.join(__dirname, '../../Oxford 3000.txt');
  const content = fs.readFileSync(wordsPath, 'utf-8');
  const words = content.split('\n').filter(word => word.trim().length > 0);

  console.log(`Found ${words.length} words to import`);

  // Clear existing words
  await prisma.progress.deleteMany();
  await prisma.word.deleteMany();

  // Insert words in batches
  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const wordData = batch.map((word, index) => ({
      word: word.trim(),
      frequency: i + index + 1, // 1-based frequency ranking
      partOfSpeech: guessPartOfSpeech(word.trim()),
    }));

    await prisma.word.createMany({
      data: wordData,
      skipDuplicates: true,
    });

    imported += batch.length;
    console.log(`Imported ${imported}/${words.length} words`);
  }

  // Create a default user for testing
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    console.log('Created test user');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
