// @generateOnly: true
// @runExternalCode: true
// @incremental: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "declaration": true },
    "files": [],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/template.ts
export const value:number="not checked";