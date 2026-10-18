import { beforeEach, describe, expect, it, vi } from 'vitest';

const { client, create } = vi.hoisted(() => ({ client: vi.fn(), create: vi.fn() }));
vi.mock('@/core/ai/openrouter.js', () => ({ getOpenRouterClient: client }));
vi.mock('../../characters/character.service.js', () => ({ GenshinCharacterService: class {} }));

import { synthesizeAdvice } from './ai-advice.service.js';

describe('optional advice synthesis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.mockReturnValue(null);
  });
  it('returns deterministic explanations when no API key is configured', async () => {
    const context = { teamComp: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'] };
    const advice = await synthesizeAdvice(context);
    expect(advice).toContain('Fervent Flames');
    expect(advice).toContain('Vaporize');
    expect(advice).toBe(await synthesizeAdvice(context));
    expect(create).not.toHaveBeenCalled();
  });
  it('returns useful advice for a new player without a team', async () => {
    expect(await synthesizeAdvice({})).toContain('Fill all four slots');
  });
  it('sends bounded synthesis context and uses nonempty provider text', async () => {
    client.mockReturnValue({ chat: { completions: { create } } });
    create.mockResolvedValue({ choices: [{ message: { content: ' Test your rotations. ' } }] });
    expect(await synthesizeAdvice({ todayPlan: 'Farm talents', teamComp: ['Bennett'] })).toBe(
      'Test your rotations.',
    );
    expect(create.mock.calls[0][0]).toMatchObject({
      max_tokens: 400,
      model: 'google/gemini-2.0-flash-001',
    });
  });
  it.each(['failure', 'empty'])('falls back for provider %s', async (mode) => {
    const fallback = await synthesizeAdvice({});
    client.mockReturnValue({ chat: { completions: { create } } });
    if (mode === 'failure') create.mockRejectedValue(new Error('provider unavailable'));
    else create.mockResolvedValue({ choices: [{ message: { content: '  ' } }] });
    expect(await synthesizeAdvice({})).toBe(fallback);
  });
});
