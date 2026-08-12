# stanpc

K-pop 그룹·멤버별 포토카드 pSEO 도감. Next.js (App Router) + TypeScript + Tailwind CSS + Prisma.

- **Production:** https://www.stanpc.com

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Copy `.env.example` to `.env` and fill in `DATABASE_URL` plus the Auth.js provider credentials (see `docs/AUTH_SPEC.md`).

## Database

```bash
npx prisma migrate dev   # apply schema
npm run db:seed          # small smoke-test seed
npm run db:import-csv    # bulk import from the root-level biasroom_*.csv / group_members_final.csv data
```

## Project structure

- `app/[group]`, `app/[group]/[member]`, `app/card/[cardSlug]` — pSEO dynamic routes
- `app/sitemap.ts`, `app/robots.ts` — generated `/sitemap.xml` and `/robots.txt`
- `components/photo-card-grid.tsx` — mobile-first responsive photo card grid
- `lib/site-config.ts` — brand name/domain/support email, used across metadata
- `prisma/schema.prisma` — Group/Member/Album/PhotoCard + Auth.js User/Account/Session models

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Auth.js Documentation](https://authjs.dev)
