import { z } from 'zod';
export const theaterElements = [
  'Pyro',
  'Hydro',
  'Anemo',
  'Electro',
  'Dendro',
  'Cryo',
  'Geo',
] as const;
export type TheaterElement = (typeof theaterElements)[number];
export const theaterCastRequestSchema = z
  .object({
    difficulty: z.enum(['EASY', 'NORMAL', 'HARD', 'VISIONARY']),
    elements: z
      .array(z.enum(theaterElements))
      .length(3)
      .refine((items) => new Set(items).size === 3, 'Choose three different elements'),
    openingKeys: z.array(z.string().min(1).max(100)).max(6).default([]),
    guestKeys: z.array(z.string().min(1).max(100)).max(8).default([]),
    selectedKeys: z.array(z.string().min(1).max(100)).max(26).default([]),
    travelerElement: z.enum(theaterElements).optional(),
  })
  .strict();
export type TheaterCastRequest = z.infer<typeof theaterCastRequestSchema>;
export interface TheaterCandidate {
  characterKey: string;
  level: number;
  element: string | null;
  badge: 'opening' | 'guest' | 'qualified';
  eligible: boolean;
  reasons: ('level' | 'element' | 'unknown_element')[];
}
export interface TheaterCastResult {
  candidates: TheaterCandidate[];
  required: number;
  qualifiedCount: number;
  selectedKeys: string[];
  invalidSelectedKeys: string[];
  ready: boolean;
}
export interface TheaterCastResponse {
  result: TheaterCastResult;
  explanations: string[];
}
