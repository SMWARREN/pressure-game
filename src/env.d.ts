// Minimal process declaration for cross-platform shared code.
// The full Node.js types are not included intentionally (browser-first codebase).
// All process.env accesses must be guarded with `typeof process !== 'undefined'`.
declare const process: {
  env: Record<string, string | undefined>;
};
