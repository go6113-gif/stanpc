# Escrow Spec
---

### 2. `docs/ESCROW_SPEC.md` 붙여넣을 내용

```markdown
# Cross-Border P2P Escrow & Trade Architecture (Phase 2)

## Business Logic Summary
1:1 글로벌 포토카드 맞교환, 차액(Top-up) 결제, 배송 API 연동, Unboxing Video 기반 분쟁 중개 시스템.

## 1. Key Features
- **Trade Agreement Engine:** 당사자 간 포카 등급(Mint, Near Mint 등) 및 차액 수동 합의 스냅샷 저장.
- **Top-up Cash Settlement:** 희귀도 차이에 따른 추가 금액(웃돈) 결제 지원 (PG 수수료 + 3~5% 마진).
- **Postal API Auto-Sync:** K-Packet, EMS, USPS 등 배송 API 상 'DELIVERED' 감지 후 48시간 내 이의 없을 시 자동 정산.
- **Unboxing Video Policy:** 개봉 영상 미첨부 시 분쟁 신청 자동 기각 (강력한 신뢰 가이드라인).

## 2. Database Schema (Prisma)
```prisma
model TradeProposal {
  id               String            @id @default(cuid())
  proposerId       String
  receiverId       String
  cashTopUp        Decimal           @default(0.00) 
  currency         String            @default("USD")
  status           ProposalStatus    @default(PENDING)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  escrow           EscrowTransaction?
  tradeAgreement   TradeAgreement?
}

model EscrowTransaction {
  id                  String         @id @default(cuid())
  tradeProposalId     String         @unique
  escrowFee           Decimal
  totalProposerAmount Decimal
  totalReceiverAmount Decimal
  status              EscrowStatus   @default(AWAITING_PAYMENT)
  proposerTrackingNo  String?
  receiverTrackingNo  String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  tradeProposal       TradeProposal  @relation(fields: [tradeProposalId], references: [id])
}

model TradeAgreement {
  id               String          @id @default(cuid())
  tradeProposalId String          @unique
  agreedCondition  String          
  agreedTopUp      Decimal         @default(0.00)
  proposerPackImg  String?         
  receiverUnboxVid String?         
  agreedAt         DateTime        @default(now())

  tradeProposal    TradeProposal   @relation(fields: [tradeProposalId], references: [id])
}

enum ProposalStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

enum EscrowStatus {
  AWAITING_PAYMENT
  DEPOSITED
  SHIPPED_IN_TRANSIT
  DELIVERED_PENDING_INSPECTION
  COMPLETED
  DISPUTED
  REFUNDED
}