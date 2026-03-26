/*
  Warnings:

  - Added the required column `isPasscodeSet` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPasscodeSet" BOOLEAN NOT NULL,
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passcode" TEXT,
ADD COLUMN     "passcodeAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passcodeLockedUntil" TIMESTAMP(3),
ADD COLUMN     "passcodeSetAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
