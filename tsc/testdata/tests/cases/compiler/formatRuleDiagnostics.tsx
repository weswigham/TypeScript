// @formatOnly: true
// @formatDiagnostics: true
// @jsx: preserve

// @filename: tsconfig.json
{
    "formattingOptions": {
        "indentSize": 2,
        "semicolons": "insert",
        "placeOpenBraceOnNewLineForFunctions": true
    },
    "files": ["input.tsx"]
}

// @filename: input.tsx
function value(input:number,other:number){
return input+other
}
const element=<Item enabled={true}/>;