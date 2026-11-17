// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/consistent-type-exports": "error" } },
    "files": ["input.ts", "provider.ts"]
}

// @filename: provider.ts
export interface Shape { value: number; }
export type Alias = string;
export const value = 1;
export class Both { value = 1; }

// @filename: input.ts
export { Shape } from "./provider";
export { Alias, value } from "./provider";
export type { Shape as ValidShape } from "./provider";
export { value as validValue, Both } from "./provider";
type Local = { value: number };
export { Local };
export type { Local as ValidLocal };