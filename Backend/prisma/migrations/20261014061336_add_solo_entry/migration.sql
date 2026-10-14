-- CreateTable
CREATE TABLE "SoloEntry" (
    "id" SERIAL NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "hackathonId" INTEGER NOT NULL,

    CONSTRAINT "SoloEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoloEntry_userId_hackathonId_key" ON "SoloEntry"("userId", "hackathonId");

-- AddForeignKey
ALTER TABLE "SoloEntry" ADD CONSTRAINT "SoloEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoloEntry" ADD CONSTRAINT "SoloEntry_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
