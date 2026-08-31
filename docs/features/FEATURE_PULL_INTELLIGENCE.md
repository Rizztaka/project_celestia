# Feature: Pull Intelligence Engine (Milestone 4E)

## Goal

Evaluate the current character and weapon banners to provide a personalized "Pull Value Score" for the user, based exclusively on their current roster, investments, and team gaps.

## Philosophy & ADR-0011 Adherence

- **Deterministic**: The value of a banner character is derived purely from how many high-tier teams they enable for the user, and how well they synergize with the user's highest-invested characters.
- **Separation of Concerns**: The engine must separate calculations (`pull-intelligence.calculator.ts`) from explanations (`pull-intelligence.explainer.ts`).

## Required Data

1. **Banners Data (`banners.json`)**: A new static JSON file defining current or upcoming banners.
   ```json
   [
     {
       "id": "banner_hutao_5.1",
       "type": "CHARACTER",
       "featuredKeys": ["HuTao", "Xingqiu", "Thoma", "Diona"],
       "endDate": "2026-10-15T23:59:59Z"
     }
   ]
   ```
2. **Team Intelligence Data**: We reuse the Team Intelligence Engine's calculations. If the user pulls Character X, how much does their highest buildable team score increase?
3. **Character Intelligence Data**: Does this banner character pair well with a character the user has already heavily invested in?

## Calculation Rules (`pull-intelligence.calculator.ts`)

A banner character's Base Pull Value is calculated as follows:

1. **Roster Status (0 or -100)**:
   - If the user already owns the 5-star character at C0, and they aren't a dedicated constellation scaler (for simplicity, we assume C0 is the goal), their pull value is drastically reduced (unless we add constellation logic later). For this milestone, owning the character reduces pull value significantly to prioritize new roster additions.
2. **Team Enabler Bonus (Up to +60)**:
   - Simulate adding the banner character to the user's roster.
   - Run the Team Calculator.
   - If this character enables a new `Tier S` or `Tier A` team that the user could not build before, add a massive bonus (+60 for S, +40 for A).
3. **Synergy Bonus (Up to +40)**:
   - Check the user's top 3 most invested characters (from Character Intelligence).
   - If the banner character frequently appears in `team-templates.json` alongside the user's top invested characters, add a synergy bonus.
4. **4-Star Value (Up to +20)**:
   - Do the 4-stars on the banner fill critical gaps (e.g., user lacks Xingqiu)? Add minor bonuses.

## Explanations (`pull-intelligence.explainer.ts`)

Must map the score and bonuses to plain-language bullets:

- "Pulling Hu Tao would unlock the S-Tier 'Vaporize Hu Tao' team (you already have Xingqiu and Zhongli built)."
- "Highly synergistic with your most invested character (Yelan)."
- "Skip: You already have this character and their early constellations are low-impact."

## API Response

`GET /api/v1/games/genshin/intelligence/pulls`

```typescript
interface PullRecommendation {
  bannerId: string;
  featuredKey: string;
  pullValueScore: number; // 0-100
  recommendation: 'MUST_PULL' | 'GOOD_VALUE' | 'SKIP';
  explanations: string[];
}
```
