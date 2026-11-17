// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/no-unused-vars": ["error", { "args": "after-used", "varsIgnorePattern": "^_", "caughtErrors": "all" }] } },
    "files": ["input.ts", "types.ts"]
}

// @filename: types.ts
export interface Shape { size: number; }
export interface UnusedShape { name: string; }

// @filename: input.ts
import type { Shape, UnusedShape } from "./types";

const unused = 1;
const _ignored = 2;
const onlyType = 3;
export type ValueType = typeof onlyType;

export function select(first: number, second: number): number {
    return second;
}

export function size(shape: Shape): number {
    return shape.size;
}

export function recover(): void {
    try {
        size({ size: 1 });
    } catch (error) {}
}