// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "unicode-bom": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
﻿const value = 1;