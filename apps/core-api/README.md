# core-api

Node.js · Express · Prisma · PostgreSQL

Main application API. Handles auth, users, workspaces, and tenant isolation.

## Stack

- **Runtime**: Node.js 20
- **Framework**: Express
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: JWT (access 15m + refresh 7d in httpOnly cookie)
- **Tests**: Jest

## Structure (planned)

```
src/
├── modules/
│   ├── auth/
│   ├── users/
│   └── workspaces/
├── middleware/
├── lib/
└── index.ts
prisma/
└── schema.prisma
```

## Dev

```bash
npm install
npm run dev       # ts-node-dev watch
npm test          # Jest
npm run migrate   # prisma migrate dev
```
