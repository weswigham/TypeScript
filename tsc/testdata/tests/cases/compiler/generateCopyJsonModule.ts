// @generate: true
// @runExternalCode: true
// @format: true
// @incremental: false, true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": {
        "target": "esnext",
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "declaration": true,
        "outDir": "dist"
    },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["templates/**/*.json"],
        "outputs": ["generated/**/*.json"],
        "command": ["copy", "templates/value.json", "generated/value.json"]
    }]
}

// @Filename: /project/templates/value.json
{"value":42,"label":"generated"}

// @Filename: /project/main.ts
import data from "./generated/value.json";
export const value: number = data.value;
export const label: string = data.label;