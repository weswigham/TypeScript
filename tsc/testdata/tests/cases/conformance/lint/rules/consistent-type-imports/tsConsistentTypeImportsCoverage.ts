// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/consistent-type-imports": "error" } },
    "files": ["input.ts", "provider.ts"]
}

// @filename: provider.ts
export interface Shape { value: number; }
export type Alias = string;
export interface UnusedShape { unused: boolean; }
export const value = 1;

// @filename: input.ts
import { Shape } from "./provider";
import { Alias, value } from "./provider";
import type { Shape as ValidShape } from "./provider";
import { UnusedShape } from "./provider";
const shape: Shape = { value };
const alias: Alias = "label";
const validShape: ValidShape = shape;
export { shape, alias, validShape };