import type { Request, Response } from "express";
import { successResponse } from "@/core/utils/response.js";
import { GenshinWeaponService } from "./weapon.service.js";

export class GenshinWeaponController {
  private weaponService: GenshinWeaponService;

  constructor() {
    this.weaponService = new GenshinWeaponService();
  }

  /**
   * GET /api/v1/games/genshin/weapons
   *
   * Returns the authenticated user's full weapon inventory.
   * Weapons are ordered by level descending.
   *
   * Returns 200 with an empty array when the user has no Genshin account
   * yet — this is a valid state, not an error.
   *
   * Protected by requireAuth — req.user!.id is guaranteed to be set.
   * No try/catch: Express 5 propagates rejected async promises to the
   * global error handler in app.ts automatically.
   */
  listWeapons = async (req: Request, res: Response) => {
    const weapons = await this.weaponService.getWeaponsForUser(req.user!.id);
    res.status(200).json(
      successResponse(
        { weapons, total: weapons.length },
        "Weapons retrieved successfully.",
      ),
    );
  };
}
