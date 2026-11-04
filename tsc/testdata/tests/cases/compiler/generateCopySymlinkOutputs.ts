// @generate: true
// @runExternalCode: true
// @currentDirectory: /project
// @link: /project/real -> /project/alias

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext" },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["first.ts"],
        "outputs": ["real/generated/*.ts"],
        "command": ["copy", "${inputs}", "real/generated/value.ts"]
    }, {
        "inputs": ["second.ts"],
        "outputs": ["alias/generated/value.ts"],
        "command": ["copy", "${inputs}", "alias/generated/value.ts"]
    }]
}

// @Filename: /project/real/keep.txt
This file establishes the symlink target before generation.

// @Filename: /project/first.ts
export const value = 1;

// @Filename: /project/second.ts
export const value = 2;

// @Filename: /project/main.ts
export const main = 1;