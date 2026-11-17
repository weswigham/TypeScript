// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/no-useless-empty-export": "error" } },
    "files": ["input.ts", "imported.ts", "standalone.ts"]
}

// @filename: input.ts
export const value = 1;
export {};

// @filename: imported.ts
import { value } from "./input";
void value;
export {};

// @filename: standalone.ts
export {};
export {};