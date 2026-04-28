import { z } from 'zod';

const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; perPage: number; hasNextPage: boolean };
}

export function parsePagination(query: unknown) {
  const { page, perPage } = PaginationQuery.parse(query);
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function buildMeta(total: number, page: number, perPage: number) {
  return { total, page, perPage, hasNextPage: page * perPage < total };
}
