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
        "jsx": "preserve",
        "declaration": true,
        "sourceMap": true,
        "outDir": "dist"
    },
    "files": ["main.ts", "jsx.d.ts"],
    "generate": [{
        "inputs": ["templates/**/*.tsx"],
        "outputs": ["generated/**/*.tsx"],
        "command": ["copy", "templates/component.tsx", "generated/component.tsx"]
    }]
}

// @Filename: /project/templates/component.tsx
export function render(value:number){return <div>{value}</div>;}

// @Filename: /project/jsx.d.ts
declare namespace JSX {
    interface Element {}
    interface IntrinsicElements { div: { children?: number }; }
}

// @Filename: /project/main.ts
import { render } from "./generated/component";
export const view = render(42);