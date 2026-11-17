// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "no-fallthrough": ["error", { "reportUnusedFallthroughComment": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const value: number;
declare function work(): void;
switch (value) { case 0: work(); case 1: break; }
switch (value) { case 0: work(); /* falls through */ case 1: break; }
switch (value) { case 0: break; /* falls through */ default: work(); }
switch (value) { case 0: try { work(); } finally { break; } case 1: work(); }
switch (value) { case 0: { work(); /* falls through */ } case 1: break; }