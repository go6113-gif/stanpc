# StanPC.com — Dev-Marketing Automation Specification
> **Domain:** [https://stanpc.com](https://stanpc.com)
> **Objective:** Synchronize Development Milestones with Autonomous Multi-Channel SNS Marketing (X, Threads, Reddit, Instagram).

---

## 1. AI Agent Team Responsibilities

- **Master Agent:** Coordinates scope, manages feature development, and triggers marketing workflows upon milestone completion.
- **Engineering Agent (Claude Code):** Builds Next.js/Prisma code, updates DB, and maintains marketing API endpoints (`/api/cron/marketing`).
- **Growth & Marketing Agent:** Listens to triggers, parses pSEO data (6,648+ cards / 931 groups), generates tailored content, and manages SNS interactions safely with rate-limiting.

---

## 2. SNS Channel Strategy & Handles

| Channel | Handle | Primary Target | Strategy |
| :--- | :--- | :--- | :--- |
| **X (Twitter)** | `@stanpc_official` | Global & KR Collectors | Real-time reply bot on `#wts`, `#wtt`, `#wtb` tags with pSEO price links & Escrow CTA. |
| **Threads** | `@stanpc_official` | Gen Z & Casual Fans | Daily top traded photocard trends, price reports, and visual cards. |
| **Reddit** | `u/stanpc_official` | NA/EU Collectors | Weekly market analysis reports on `r/kpopforsale` and price guide references. |
| **Instagram** | `@stanpc_official` | Global Visual Audience | Automated card news & Reels showcasing escrow trade process. |

---

## 3. Development-Marketing Synchronization Matrix

[Feature Release / DB Update]
         │
         ▼
[pSEO Metadata & Link Generation] (`lib/marketing/social-generator.ts`)
         │
         ▼
[Marketing Cron / API Trigger] (`app/api/cron/marketing/route.ts`)
         │
         ├───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
    X (Twitter)           Threads             Reddit
  (#wtt auto-reply)   (Daily pSEO post)  (Weekly price guide)

### Triggers & Actions:
1. **Phase 1: DB Bulk Seed Completed (6,648 Cards / 931 Groups)**
   - *Action:* Enable `social-generator.ts` to output price check templates for all card slugs.
2. **Phase 2: Auth & 4 Social Logins (Google, X, Kakao, Naver)**
   - *Action:* Publish "1-Second Safe Login & Escrow Teaser" across X and Threads.
3. **Phase 3: Escrow & P2P API Implementation (In Progress)**
   - *Action:* Generate "Anti-Fraud 3-Step Escrow Guide" for Reddit (`r/kpopforsale`) and X.
4. **Phase 4: Vercel Production Deployment & OG Tags Live**
   - *Action:* Activate automated X bot monitoring `#wtt_[group]` tags to supply `[stanpc.com/card/](https://stanpc.com/card/)[slug]` links.

---

## 4. Technical Specifications & Endpoints

### 1) Content Generator Utility: `lib/marketing/social-generator.ts`
- Functions: `generateCardSocialPost(card)`
- Formats text dynamically per platform rules (hashtags for X, markdown for Reddit).

### 2) Automated Cron Payload API: `app/api/cron/marketing/route.ts`
- Picks featured cards/groups from DB.
- Returns JSON payload ready for external social media schedulers or LLM post execution.

---

## 5. Account Safety & Anti-Spam Guardrails
- **Rate Limit:** Maximum 1 post per 15 minutes per channel.
- **Randomized Delay:** Apply 2-10 min random jitter to automated replies on X/Reddit to prevent shadowbans.
- **Fail-Safe:** If an API fails or hits rate limit, fail gracefully and log error without crashing main server.