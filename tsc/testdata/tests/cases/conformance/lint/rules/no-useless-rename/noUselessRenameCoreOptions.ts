// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-rename": ["error", { "ignoreDestructuring": true, "ignoreImport": true, "ignoreExport": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
import { foo as foo } from "module";
export { foo as foo };
const { value: value } = object;