-- CreateTable
CREATE TABLE "SoundChangeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoundChangeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoundChangeExercise" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoundChangeExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoundChangeExerciseItem" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "audioPath" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "blank" TEXT,
    "blankIndex" INTEGER,
    "explanation" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoundChangeExerciseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoundChangeProgress" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoundChangeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoundChangeCategory_slug_key" ON "SoundChangeCategory"("slug");

-- CreateIndex
CREATE INDEX "SoundChangeProgress_userId_itemId_idx" ON "SoundChangeProgress"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "SoundChangeExercise" ADD CONSTRAINT "SoundChangeExercise_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SoundChangeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoundChangeExerciseItem" ADD CONSTRAINT "SoundChangeExerciseItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "SoundChangeExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoundChangeProgress" ADD CONSTRAINT "SoundChangeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoundChangeProgress" ADD CONSTRAINT "SoundChangeProgress_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SoundChangeExerciseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
