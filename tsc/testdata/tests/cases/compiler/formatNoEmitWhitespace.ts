// @format: true
// @formatOnly: false, true
// @formatDiagnostics: false, true
// @noEmit: true

// @filename: tsconfig.json
{
    "formattingOptions": {
        "indentSize": 2,
        "tabSize": 2,
        "convertTabsToSpaces": false,
        "newLineCharacter": "\r\n",
        "semicolons": "remove"
    },
    "files": ["input.ts"]
}

// @filename: input.ts
export function value(input:number){
const result={value:input+1};
return result;
}