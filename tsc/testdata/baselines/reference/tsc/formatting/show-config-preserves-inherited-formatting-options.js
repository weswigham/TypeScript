currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
const value=1;

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"formattingOptions":{"indentStyle":"SMART","semicolons":"insert","indentSize":2},"files":["input.ts"]}

tsgo --showConfig -p .
ExitStatus:: Success
Output::
{
    "formattingOptions": {
        "indentSize": 2,
        "indentStyle": "smart",
        "semicolons": "insert"
    },
    "compilerOptions": {},
    "files": [
        "./input.ts"
    ]
}
