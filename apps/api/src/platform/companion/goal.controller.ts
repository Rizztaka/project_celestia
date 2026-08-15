import type { Request, Response } from 'express';
import { successResponse } from '@/core/utils/response.js';
import { GoalService } from './goal.service.js';

export class GoalController {
  private readonly goalService: GoalService;

  constructor() {
    this.goalService = new GoalService();
  }

  /**
   * POST /api/v1/companion/goals
   * Create an upgrade goal for the authenticated user.
   */
  createGoal = async (req: Request, res: Response) => {
    const goal = await this.goalService.createGoal(req.user!.id, req.body);
    res.status(201).json(successResponse(goal, 'Goal created successfully.'));
  };

  /**
   * GET /api/v1/companion/goals
   * List all upgrade goals for the authenticated user.
   */
  listGoals = async (req: Request, res: Response) => {
    const goals = await this.goalService.listGoals(req.user!.id);
    res.status(200).json(successResponse(goals, 'Goals fetched.'));
  };

  /**
   * DELETE /api/v1/companion/goals/:id
   * Delete an upgrade goal. Returns 404 if the goal doesn't belong to the user.
   */
  deleteGoal = async (req: Request, res: Response) => {
    await this.goalService.deleteGoal(req.user!.id, req.params['id'] as string);
    res.status(204).send();
  };

  /**
   * GET /api/v1/companion/goals/materials
   * Returns { needed, inventory, delta } for all active goals.
   */
  getMaterials = async (req: Request, res: Response) => {
    const delta = await this.goalService.getMaterialDelta(req.user!.id);
    res.status(200).json(successResponse(delta, 'Material delta computed.'));
  };

  /**
   * GET /api/v1/companion/goals/today
   * Returns today's open domains (Asia server) filtered by the user's goals.
   */
  getTodayDomains = async (req: Request, res: Response) => {
    const result = await this.goalService.getTodayDomains(req.user!.id);
    res.status(200).json(successResponse(result, "Today's domains fetched."));
  };
}
