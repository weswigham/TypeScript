// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo(){_____________let_bar;_____________try_{_________________bar_=_2;_________________unsafeFn();_________________bar_=_4;_____________}_catch_{________________//_handle_error_____________}_____________return_bar;_________}____________function_unsafeFn()_{_____________throw_new_Error();_________} (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "force",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-assignment": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
function foo(){
            let bar;
            try {
                bar = 2;
                unsafeFn();
                bar = 4;
            } catch {
               // handle error
            }
            return bar;
        }   
        function unsafeFn() {
            throw new Error();
        }