// @generate: true
// @runExternalCode: true
// @incremental: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext", "declaration": true },
    "include": ["generated/**/*.ts"],
    "generate": [{
        "inputs": ["templates/**/*.ts"],
        "outputs": ["generated/**/*.ts"],
        "command": ["copy", "templates/source.ts", "generated/nested/value.ts"]
    }]
}

// @Filename: /project/templates/source.ts
export const value = 42;