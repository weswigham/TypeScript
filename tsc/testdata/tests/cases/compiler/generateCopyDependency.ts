// @generate: true
// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext" },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["intermediate/value.ts"],
        "command": ["copy", "${inputs}", "intermediate/value.ts"]
    }, {
        "inputs": ["intermediate/value.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/template.ts
export const value = 42;

// @Filename: /project/main.ts
export const main = 1;