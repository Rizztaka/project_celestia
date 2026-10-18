import { z } from 'zod';

export const importSections = ['characters', 'weapons', 'artifacts', 'materials'] as const;
export const importSectionSchema = z.enum(importSections);
export type ImportSection = z.infer<typeof importSectionSchema>;

const uniqueSections = z
  .array(importSectionSchema)
  .max(4)
  .refine(
    (sections) => new Set(sections).size === sections.length,
    'Select each section only once.',
  );
const requestShape = {
  requestVersion: z.literal(1),
  payload: z.unknown().refine((value) => value !== undefined, 'A GOOD payload is required.'),
  sections: uniqueSections.refine(
    (sections) => sections.length > 0,
    'Select at least one section.',
  ),
};
export const importPreviewRequestSchema = z.object(requestShape).strict();
export const importCommitRequestSchema = z
  .object({
    ...requestShape,
    previewToken: z.string().min(1).max(4096),
    confirmClear: uniqueSections,
  })
  .strict();
export type ImportPreviewRequest = z.infer<typeof importPreviewRequestSchema>;
export type ImportCommitRequest = z.infer<typeof importCommitRequestSchema>;
export interface ImportSectionPreview {
  section: ImportSection;
  action: 'preserve' | 'merge' | 'replace' | 'clear';
  currentCount: number;
  incomingCount: number | null;
  resultingCount: number;
}
export interface ImportPreview {
  previewToken: string;
  expiresAt: string;
  sections: ImportSectionPreview[];
  clearSections: ImportSection[];
}
export interface ImportResult {
  charactersImported: number;
  weaponsImported: number;
  artifactsImported: number;
  materialsImported: number;
  sections: ImportSection[];
}

export interface ImportSectionStatus {
  section: ImportSection;
  status: 'unknown' | 'imported';
  importedAt: string | null;
  source: string | null;
  entryCount: number | null;
  scope: 'merged_entries' | 'replacement_section';
}
export interface ImportStatus {
  sections: ImportSectionStatus[];
}
