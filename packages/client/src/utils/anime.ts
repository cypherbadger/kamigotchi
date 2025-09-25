// Normalized anime.js import for TypeScript across CJS/ESM builds
// Consumers can safely `import anime from 'utils/anime'`
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - typings vary across versions, we normalize at runtime
import * as animeModule from 'animejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mod: any = animeModule as any;
const anime = mod.anime ?? mod.default ?? mod;

export default anime;

// Normalized anime.js import for TypeScript across CJS/ESM builds
// Tries ESM first, falls back to default export, then to namespace
// Consumers can always `import anime from 'utils/anime'`

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types may not match exact runtime shape, we normalize below
import * as animeNs from 'animejs';

// Prefer named export if present (v4+ typings)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const animeAny: any = animeNs as any;
const anime = animeAny.anime ?? animeAny.default ?? animeAny;

export default anime;
