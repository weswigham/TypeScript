// @generateOnly: true
// @format: true
// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/template.ts
export const generated = 42;

// @Filename: /project/main.ts
export const value:number="not checked or formatted";