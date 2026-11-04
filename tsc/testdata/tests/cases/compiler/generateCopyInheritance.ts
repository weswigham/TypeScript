// @generate: true
// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "extends": ["./base/first.json", "./base/middle.json"],
    "compilerOptions": { "target": "esnext", "module": "esnext", "moduleResolution": "bundler", "declaration": true },
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

// @Filename: /project/base/middle.json
{ "extends": "./generator.json" }

// @Filename: /project/base/generator.json
{
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/base/template.ts
export const value = 42;

// @Filename: /project/main.ts
import { value } from "./base/generated/value";
export const result = value;