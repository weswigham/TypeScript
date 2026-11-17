// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": {
        "rules": {
            "@typescript-eslint/naming-convention": [
                "error",
                { "selector": "variable", "format": ["camelCase"] },
                { "selector": ["variable", "parameter"], "modifiers": ["const"], "format": null },
                { "selector": "parameter", "format": ["camelCase"] }
            ]
        }
    },
    "files": ["input.ts"]
}
// @filename: input.ts
const allowed_name = 1;
let rejected_name = allowed_name;
function acceptParameter(rejected_parameter: number) {
    return rejected_parameter;
}
