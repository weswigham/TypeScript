// @generate: true
// @runExternalCode: true
// @format: true
// @incremental: true
// @currentDirectory: /workspace[demo]/project

// @Filename: /workspace[demo]/project/config/tsconfig.json
{
    "compilerOptions": {
        "target": "esnext",
        "module": "esnext",
        "moduleResolution": "bundler",
        "declaration": true,
        "sourceMap": true
    },
    "files": ["../main.ts"],
    "generate": [{
        "inputs": ["../template.ts"],
        "outputs": ["../generated/value.ts"],
        "command": ["copy", "${inputs}", "../generated/value.ts"]
    }]
}

// @Filename: /workspace[demo]/project/template.ts
export function value(){return 42;}

// @Filename: /workspace[demo]/project/main.ts
import{value}from "./generated/value";
export const result=value();