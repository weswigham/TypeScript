// @formatOnly: true
// @filename: base.json
{
    "formattingOptions": {
        "indentSize": 2,
        "tabSize": 2,
        "insertSpaceBeforeAndAfterBinaryOperators": false
    }
}
// @filename: tsconfig.json
{
    "extends": "./base.json",
    "formattingOptions": {
        "insertSpaceAfterCommaDelimiter": false
    },
    "files": ["input.ts"]
}
// @filename: input.ts
function value(input:number,other:number){
return input + other;
}
