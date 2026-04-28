# frontend

Next.js · Material UI · React Query · Stripe Elements

Main user-facing application.

## Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Material UI v6
- **Server state**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Payments**: Stripe Elements

## Pages

| Route             | Description                         |
|-------------------|-------------------------------------|
| `/login`          | Email + password auth               |
| `/register`       | New account                         |
| `/dashboard`      | Workspace overview, members, events |
| `/files`          | Upload, progress, processed results |
| `/billing`        | Plan, renewal date, upgrade/cancel  |
| `/settings`       | Profile, workspace settings         |

## Dev

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```
