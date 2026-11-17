// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": { "rules": { "@typescript-eslint/switch-exhaustiveness-check": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
enum State { Ready, Waiting }
declare const state: State;
switch (state) { case State.Ready: break; }
declare const payload: { kind: 'open' } | { kind: 'closed' };
switch (payload.kind) { case 'open': break; default: break; }
declare const enabled: boolean;
switch (enabled) { case true: break; }
declare const numeric: number;
switch (numeric) { case 1: break; }