// @generate: true
// @runExternalCode: true
// @format: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext" },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["missing.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/main.ts
export const main=1;