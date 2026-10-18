import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const elements: Record<string, string> = require('../static/character-elements.json');
const catalog = require('../static/progression-catalog.json') as {
  characters: Record<string, { gameId: number }>;
};
// Display aliases are compatibility joins, never additional collectible characters.
const aliases: Record<string, string> = {
  'Hu Tao': 'HuTao',
  'Yun Jin': 'YunJin',
  Kazuha: 'KaedeharaKazuha',
  Ayaka: 'KamisatoAyaka',
  Ayato: 'KamisatoAyato',
  Kokomi: 'SangonomiyaKokomi',
  Heizou: 'ShikanoinHeizou',
  Itto: 'AratakiItto',
  Sara: 'KujouSara',
  Yae: 'YaeMiko',
  Childe: 'Tartaglia',
  Scaramouche: 'Wanderer',
  Kukishinobu: 'KukiShinobu',
  Traveler: 'Aether',
};
export const characterElements: Readonly<Record<string, string>> = Object.freeze({
  ...elements,
  ...Object.fromEntries(Object.entries(aliases).map(([alias, key]) => [alias, elements[key]!])),
});
export const collectibleCharacterCount = new Set(
  Object.values(catalog.characters).map((character) => character.gameId),
).size;
