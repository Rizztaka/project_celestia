import type { TheaterCastRequest, TheaterCastResult } from '@celestia/api-contracts';
export function explainTheaterCast(result: TheaterCastResult, rules: TheaterCastRequest): string[] {
  return [
    `Planning preset: ${rules.difficulty}, level 70+, ${result.required} characters. This is not an automatically verified current season.`,
    `Allowed elements: ${rules.elements.join(', ')}. Opening Cast and Special Guests bypass element restrictions but still require level 70.`,
    `${result.qualifiedCount} recorded characters qualify; ${result.selectedKeys.length} selected. ${Math.max(0, result.required - result.selectedKeys.length)} more needed.`,
    'Only your recorded roster counts. Unowned opening trials and borrowed characters are not assumed. Choose the season elements and exceptions from the in-game Theater.',
    ...(result.invalidSelectedKeys.length
      ? [
          'Some selected characters are ineligible or absent from the recorded roster; they do not count.',
        ]
      : []),
  ];
}
