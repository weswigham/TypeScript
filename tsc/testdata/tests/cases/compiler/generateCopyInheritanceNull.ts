// @generate: true
// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "extends": ["./base/first.json", "./base/reset.json"],
    "compilerOptions": { "target": "esnext", "module": "esnext" },
    "files": ["main.ts"]
}

// @Filename: /project/base/first.json
{
    "generate": [{
        "inputs": ["missing.ts"],
        "outputs": ["discarded.ts"],
        "command": ["copy", "${inputs}", "discarded.ts"]
    }]
}

// @Filename: /project/base/reset.json
{ "generate": null }

// @Filename: /project/main.ts
export const value = 42;