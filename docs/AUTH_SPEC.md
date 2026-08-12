# Authentication & Identity Verification Specification

## Overview
stanpc.com의 로그인 및 단계별 본인인증(Identity Verification) 아키텍처.

## 1. MVP Phase: Social Authentication
- **Framework:** NextAuth.js (Auth.js) v5 or Supabase Auth
- **Providers:**
  - Google OAuth
  - Twitter (X) OAuth (K-pop 팬덤 평점 연동용)
  - Kakao OAuth (국내 유저 편의성)
  - Naver OAuth (국내 유저 편의성)
- **Strategy:** 
  - OAuth 가입 시 기본 유저 생성 (`isVerified: false`).
  - pSEO 디렉토리 조회 및 단순 관심 등록은 비로그인/기본 로그인 상태에서 허용.

## 2. Phase 2: KYC & Cross-Border Identity Verification
- **Purpose:** P2P 맞교환 거래, 에스크로 결제, 분쟁 발생 시 법적/신뢰 보장.
- **Verification Stack:**
  - **Domestic (KR):** DANAL / PASS / Toss Mobile Phone Identity Verification API.
  - **Global (US/JP/Global):** Stripe Identity or Persona (Passport/ID Card + Selfie match).
- **User Database Schema (Prisma):**
```prisma
model User {
  id                 String             @id @default(cuid())
  email              String             @unique
  name               String?
  image              String?
  
  provider           String             // google, kakao, twitter, apple
  providerAccountId  String
  
  isVerified         Boolean            @default(false)
  verifiedAt         DateTime?
  phoneNumber        String?
  countryCode        String?            // KR, US, JP, etc.
  reputationScore    Int                @default(100)
  
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}