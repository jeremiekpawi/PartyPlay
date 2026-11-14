export const FRENCH_WORDS: readonly string[] = [
  'mangue',
  'soleil',
  'guitare',
  'lion',
  'velo',
  'pirogue',
  'tambour',
  'ananas',
  'football',
  'parapluie',
  'fusee',
  'cafe',
  'maison',
  'elephant',
  'tortue',
  'banane',
  'lunettes',
  'avion',
  'livre',
  'chaussure',
  'etoile',
  'montagne',
  'telephone',
  'chapeau',
  'papillon',
  'bouteille',
  'nuage',
  'bateau',
  'horloge',
  'piano',
  'poisson',
  'fleur',
  'bougie',
  'valise',
  'pont',
  'cerf-volant',
  'citron',
  'camera',
  'serpent',
  'couronne',
  'crocodile',
  'ballon',
  'palmiste',
  'couscous',
  'moto',
  'ponton',
  'girafe',
  'arc-en-ciel',
  'marmite',
  'violon',
] as const;

export function normalizeWordForCompare(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_'\s]+/g, ' ')
    .trim();
}

export function buildWordMask(word: string): string {
  return word
    .split('')
    .map((ch) => {
      if (ch === ' ' || ch === '-') return ch;
      return '_';
    })
    .join(' ');
}
