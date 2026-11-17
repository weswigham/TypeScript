// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/triple-slash-reference": ["error", { "path": "never", "types": "prefer-import", "lib": "always" }] } },
    "files": ["input.ts", "valid.ts"]
}

// @filename: dependency.d.ts
export interface Shape { size: number; }

// @filename: node_modules/@types/coverage-types/index.d.ts
export const value: number;

// @filename: input.ts
/// <reference path="./dependency.d.ts" />
/// <reference types="coverage-types" />
import { value } from "coverage-types";
void value;

// @filename: valid.ts
/// <reference lib="esnext" />
import type { Shape } from "./dependency";
const shape: Shape = { size: 1 };
void shape;