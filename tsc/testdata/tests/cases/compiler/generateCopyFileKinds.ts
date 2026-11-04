// @generate: true
// @runExternalCode: true
// @incremental: false, true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext" },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["templates/input.json"],
        "outputs": ["generated/output.json"],
        "command": ["copy", "${inputs}", "generated/output.json"]
    }, {
        "inputs": ["templates/input.yaml"],
        "outputs": ["generated/output.yaml"],
        "command": ["copy", "${inputs}", "generated/output.yaml"]
    }, {
        "inputs": ["templates/input.sql"],
        "outputs": ["generated/output.sql"],
        "command": ["copy", "${inputs}", "generated/output.sql"]
    }, {
        "inputs": ["templates/input.d.ts"],
        "outputs": ["generated/output.d.ts"],
        "command": ["copy", "${inputs}", "generated/output.d.ts"]
    }, {
        "inputs": ["templates/input.tsx"],
        "outputs": ["generated/output.tsx"],
        "command": ["copy", "${inputs}", "generated/output.tsx"]
    }]
}

// @Filename: /project/templates/input.json
{ "value": 42 }

// @Filename: /project/templates/input.yaml
value: 42

// @Filename: /project/templates/input.sql
SELECT 42 AS value;

// @Filename: /project/templates/input.d.ts
export interface Value { value: number; }

// @Filename: /project/templates/input.tsx
export const value = <div>42</div>;

// @Filename: /project/main.ts
export const main = 1;