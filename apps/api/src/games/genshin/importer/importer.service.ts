import {
  importCommitRequestSchema,
  type ImportPreview,
  importPreviewRequestSchema,
  type ImportResult,
  type ImportSectionPreview,
  importSections,
  type ImportStatus,
} from '@celestia/api-contracts';

import { BadRequestError, ConflictError } from '@/core/errors/app-error.js';

import { assertImportCounts, assertImportResources } from './importer.limits.js';
import { fingerprint, issuePreview, verifyPreview } from './importer.preview.js';
import {
  GenshinImportRepository,
  type ImportSelection,
  type ImportSnapshot,
} from './importer.repository.js';
import { GoodPayloadSchema } from './importer.schema.js';

export class GenshinImportService {
  constructor(
    private readonly repository: Pick<
      GenshinImportRepository,
      'readSnapshot' | 'commit' | 'readMetadata'
    > = new GenshinImportRepository(),
  ) {}

  async status(userId: string): Promise<ImportStatus> {
    const metadata = await this.repository.readMetadata(userId);
    return {
      sections: importSections.map((section) => {
        const row = metadata.find((entry) => entry.section === section);
        return {
          section,
          status: row ? 'imported' : 'unknown',
          importedAt: row?.importedAt.toISOString() ?? null,
          source: row?.source ?? null,
          entryCount: row?.entryCount ?? null,
          scope: section === 'characters' ? 'merged_entries' : 'replacement_section',
        };
      }),
    };
  }

  async preview(userId: string, input: unknown): Promise<ImportPreview> {
    const selection = this.selection(input);
    const state = await this.repository.readSnapshot(userId);
    const sections = this.describe(selection, state);
    return {
      ...issuePreview(userId, fingerprint(selection), fingerprint(state)),
      sections,
      clearSections: sections
        .filter((section) => section.action === 'clear')
        .map(({ section }) => section),
    };
  }

  async importAccount(userId: string, input: unknown): Promise<ImportResult> {
    assertImportResources(input);
    const parsed = importCommitRequestSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestError(
        'Preview your import first, then submit the versioned request with its preview token and clearing confirmations.',
      );
    const { previewToken, confirmClear, ...request } = parsed.data;
    const selection = this.selection(request);
    const expectedState = verifyPreview(previewToken, userId, fingerprint(selection));
    await this.repository.commit(userId, (state) => {
      if (fingerprint(state) !== expectedState)
        throw new ConflictError(
          'Your account changed since this preview. Preview your import again.',
        );
      const clears = this.describe(selection, state)
        .filter((section) => section.action === 'clear')
        .map(({ section }) => section);
      if (
        clears.length !== confirmClear.length ||
        clears.some((section) => !confirmClear.includes(section))
      ) {
        throw new BadRequestError(
          'Explicitly confirm each empty inventory section that will be cleared.',
        );
      }
      return selection;
    });
    const { payload, sections } = selection;
    return {
      charactersImported: sections.includes('characters') ? payload.characters!.length : 0,
      weaponsImported: sections.includes('weapons') ? payload.weapons!.length : 0,
      artifactsImported: sections.includes('artifacts') ? payload.artifacts!.length : 0,
      materialsImported: sections.includes('materials')
        ? Object.values(payload.materials!).filter((quantity) => quantity > 0).length
        : 0,
      sections,
    };
  }

  private selection(input: unknown): ImportSelection {
    assertImportResources(input);
    const request = importPreviewRequestSchema.parse(input);
    const payload = GoodPayloadSchema.parse(request.payload);
    for (const section of request.sections) {
      if (payload[section] === undefined)
        throw new BadRequestError(
          `The export has no ${section} section. Leave it unselected to preserve your saved data.`,
        );
    }
    return {
      payload,
      sections: importSections.filter((section) => request.sections.includes(section)),
    };
  }

  private describe(
    { payload, sections }: ImportSelection,
    state: ImportSnapshot,
  ): ImportSectionPreview[] {
    const selected = new Set(sections);
    const knownCharacters = new Set(state?.characters.map((character) => character.characterKey));
    const incomingKeys = new Set<string>();
    if (selected.has('characters')) {
      for (const character of payload.characters!) {
        if (incomingKeys.has(character.key))
          throw new BadRequestError(`Duplicate character: ${character.key}.`);
        incomingKeys.add(character.key);
        knownCharacters.add(character.key);
      }
    }
    for (const section of ['weapons', 'artifacts'] as const) {
      if (!selected.has(section)) continue;
      const occupied = new Set<string>();
      for (const item of payload[section]!) {
        if (!item.location) continue;
        if (!knownCharacters.has(item.location))
          throw new BadRequestError(
            `Unresolved ${section} location: ${item.location}. Include that character in the selected roster or correct the export.`,
          );
        const slot = 'slotKey' in item ? `${item.location}:${item.slotKey}` : item.location;
        if (occupied.has(slot))
          throw new BadRequestError(
            `Multiple ${section} claim the same equipment location: ${slot}.`,
          );
        occupied.add(slot);
      }
    }
    const descriptions = importSections.map<ImportSectionPreview>((section) => {
      const currentCount = state?.[section].length ?? 0;
      const data = payload[section];
      const incomingCount =
        data === undefined
          ? null
          : section === 'materials'
            ? Object.values(payload.materials!).filter((quantity) => quantity > 0).length
            : (data as unknown[]).length;
      if (!selected.has(section))
        return {
          section,
          action: 'preserve',
          currentCount,
          incomingCount,
          resultingCount: currentCount,
        };
      return {
        section,
        action: section === 'characters' ? 'merge' : incomingCount === 0 ? 'clear' : 'replace',
        currentCount,
        incomingCount,
        resultingCount: section === 'characters' ? knownCharacters.size : incomingCount!,
      };
    });
    assertImportCounts({
      characters: knownCharacters.size,
      weapons: selected.has('weapons') ? payload.weapons!.length : (state?.weapons.length ?? 0),
      artifacts: selected.has('artifacts')
        ? payload.artifacts!.length
        : (state?.artifacts.length ?? 0),
      materials: selected.has('materials')
        ? Object.keys(payload.materials!).length
        : (state?.materials.length ?? 0),
    });
    return descriptions;
  }
}
