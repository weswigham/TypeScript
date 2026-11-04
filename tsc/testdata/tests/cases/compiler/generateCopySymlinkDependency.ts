// @generate: true
// @runExternalCode: true
// @currentDirectory: /project
// @link: /project/real -> /project/alias

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext" },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["real/generated/value.ts"],
        "command": ["copy", "${inputs}", "real/generated/value.ts"]
    }, {
        "inputs": ["alias/generated/value.ts"],
        "outputs": ["final.ts"],
        "command": ["copy", "${inputs}", "final.ts"]
    }]
}

// @Filename: /project/real/keep.txt
This file establishes the symlink target before generation.

// @Filename: /project/template.ts
export const value = 42;

// @Filename: /project/main.ts
export const main = 1;