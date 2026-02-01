-- DropForeignKey
ALTER TABLE "ListeningProgress" DROP CONSTRAINT "ListeningProgress_userId_fkey";

-- AddForeignKey
ALTER TABLE "ListeningProgress" ADD CONSTRAINT "ListeningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
