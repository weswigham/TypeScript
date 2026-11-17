// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo(){_____________let_bar,_baz;_____________try_{_________________bar_=_2;_________________unsafeFn();_________________return_{_error:_undefined_};_____________}_catch_{________________baz_=_bar;_____________}_____________return_baz;_________}____________function_unsafeFn()_{_____________throw_new_Error();_________} (invocation 1).
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
            let bar, baz;
            try {
                bar = 2;
                unsafeFn();
                return { error: undefined };
            } catch {
               baz = bar;
            }
            return baz;
        }   
        function unsafeFn() {
            throw new Error();
        }