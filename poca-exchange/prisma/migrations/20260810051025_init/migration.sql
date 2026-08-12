-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "countryCode" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameKr" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agency" TEXT,
    "debutDate" TIMESTAMP(3),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameKr" TEXT,
    "imageUrl" TEXT,
    "position" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_cards" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cardName" TEXT,
    "version" TEXT,
    "imageUrl" TEXT,
    "thumbImagePath" TEXT,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT,
    "albumId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_providerAccountId_key" ON "users"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");

-- CreateIndex
CREATE INDEX "members_groupId_idx" ON "members"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "members_groupId_slug_key" ON "members"("groupId", "slug");

-- CreateIndex
CREATE INDEX "albums_groupId_idx" ON "albums"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "albums_groupId_slug_key" ON "albums"("groupId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "photo_cards_slug_key" ON "photo_cards"("slug");

-- CreateIndex
CREATE INDEX "photo_cards_groupId_idx" ON "photo_cards"("groupId");

-- CreateIndex
CREATE INDEX "photo_cards_memberId_idx" ON "photo_cards"("memberId");

-- CreateIndex
CREATE INDEX "photo_cards_albumId_idx" ON "photo_cards"("albumId");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_cards" ADD CONSTRAINT "photo_cards_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_cards" ADD CONSTRAINT "photo_cards_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_cards" ADD CONSTRAINT "photo_cards_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;
