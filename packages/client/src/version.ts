declare const __APP_VERSION__: string;

/** Game version (root package.json; history in CHANGELOG.md). */
export const VERSION = __APP_VERSION__;

/** A file in public/assets, tagged with the version so a new release never reuses an old cached copy. */
export const assetUrl = (path: string): string => `${import.meta.env.BASE_URL}assets/${path}?v=${VERSION}`;
export const AUTHOR_URL = 'https://github.com/badjuice';
export const ISSUES_URL = 'https://github.com/badjuice/tximtxom/issues/new';
export const CONTACT_EMAIL = 'noxfortes@gmail.com';
