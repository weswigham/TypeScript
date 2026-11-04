// @generate: true
// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "extends": "./base/generator.json",
    "compilerOptions": { "target": "esnext", "module": "esnext", "moduleResolution": "bundler" },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/base/generator.json
{
    "generate": [{
        "inputs": ["missing.ts"],
        "outputs": ["discarded.ts"],
        "command": ["copy", "${inputs}", "discarded.ts"]
    }]
}

// @Filename: /project/template.ts
export const value = 42;

// @Filename: /project/main.ts
import { value } from "./generated/value";
export const result = value;