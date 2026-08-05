import { GenshinArtifactRepository } from "./artifact.repository.js";
import { NotFoundError } from "@/core/errors/app-error.js";
import type { GenshinArtifact, Prisma } from "@prisma/client";

/**
 * Represents a single artifact sub-stat.
 * key references a static stat constant (e.g. "critRate_", "atk_", "hp").
 * value is the raw numeric value (e.g. 6.6 for 6.6% crit rate).
 */
export interface ArtifactSubStat {
  key: string;
  value: number;
}

export interface AddArtifactInput {
  setKey: string;      // e.g. "ShimenawasReminiscence"
  slotKey: string;     // "flower" | "plume" | "sands" | "goblet" | "circlet"
  level: number;       // 0–20
  rarity: number;      // 1–5
  mainStatKey: string; // e.g. "hp", "critRate_", "eleMas"
  subStats: ArtifactSubStat[];
  locked?: boolean;
}

export interface UpdateArtifactInput {
  level?: number;
  locked?: boolean;
  subStats?: ArtifactSubStat[];
}

export class GenshinArtifactService {
  private artifactRepository: GenshinArtifactRepository;

  constructor() {
    this.artifactRepository = new GenshinArtifactRepository();
  }

  /**
   * Adds an artifact to the account's inventory.
   * Artifacts are unequipped (equippedCharacterId = null) on creation.
   * Multiple artifacts with the same setKey/slotKey are allowed —
   * a player can own many flower pieces from the same set.
   */
  async addArtifact(
    accountId: string,
    input: AddArtifactInput,
  ): Promise<GenshinArtifact> {
    return this.artifactRepository.create({
      account: { connect: { id: accountId } },
      setKey: input.setKey,
      slotKey: input.slotKey,
      level: input.level,
      rarity: input.rarity,
      mainStatKey: input.mainStatKey,
      // ArtifactSubStat[] must be cast to Prisma.InputJsonValue because our
      // typed interface lacks the index signature Prisma's Json type requires.
      subStats: input.subStats as unknown as Prisma.InputJsonValue,
      locked: input.locked ?? false,
    });
  }

  /**
   * Returns all artifacts in the account's inventory.
   */
  async getArtifacts(accountId: string): Promise<GenshinArtifact[]> {
    return this.artifactRepository.findByAccountId(accountId);
  }

  /**
   * Returns a single artifact by ID, scoped to the account.
   * NotFoundError is returned whether the artifact doesn't exist or belongs to
   * another account (anti-enumeration).
   */
  async getArtifactById(
    accountId: string,
    artifactId: string,
  ): Promise<GenshinArtifact> {
    const artifact = await this.artifactRepository.findById(artifactId);
    if (!artifact || artifact.accountId !== accountId) {
      throw new NotFoundError("Artifact not found.");
    }
    return artifact;
  }

  /**
   * Updates an artifact's level, lock status, or sub-stats.
   * (Sub-stats can change from upgrade rolls — this supports manual correction.)
   * Throws NotFoundError if not found or if it belongs to another account.
   */
  async updateArtifact(
    accountId: string,
    artifactId: string,
    input: UpdateArtifactInput,
  ): Promise<GenshinArtifact> {
    await this.getArtifactById(accountId, artifactId);
    return this.artifactRepository.update(artifactId, {
      level: input.level,
      locked: input.locked,
      subStats: input.subStats as unknown as Prisma.InputJsonValue,
    });
  }

  /**
   * Removes an artifact from inventory.
   * Throws NotFoundError if not found or if it belongs to another account.
   */
  async removeArtifact(
    accountId: string,
    artifactId: string,
  ): Promise<GenshinArtifact> {
    await this.getArtifactById(accountId, artifactId);
    return this.artifactRepository.delete(artifactId);
  }
}
