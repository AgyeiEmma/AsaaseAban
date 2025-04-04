-- CreateTable
CREATE TABLE "LandParcel" (
    "id" SERIAL NOT NULL,
    "owner" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "ipfsHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandParcel_pkey" PRIMARY KEY ("id")
);
