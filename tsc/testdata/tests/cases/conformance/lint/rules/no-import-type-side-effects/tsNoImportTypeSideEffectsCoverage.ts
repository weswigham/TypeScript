// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-import-type-side-effects": "error"
        }
    },
    "files": ["input.ts", "dependency.d.ts"]
}

// @filename: dependency.d.ts
declare module "coverage-types" {
    export interface First {
        first: number;
    }
    export interface Second {
        second: string;
    }
    export const runtime: number;
}

// @filename: input.ts
import { type First, type Second as Alias } from "coverage-types";

import type { First as TopLevel } from "coverage-types";
import { type Second, runtime } from "coverage-types";
import "coverage-types";

type Combined = First & Alias & TopLevel & Second;
runtime;