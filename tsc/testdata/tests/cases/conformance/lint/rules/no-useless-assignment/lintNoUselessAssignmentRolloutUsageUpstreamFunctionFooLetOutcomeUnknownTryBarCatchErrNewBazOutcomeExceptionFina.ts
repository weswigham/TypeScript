// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo()_{_____let_outcome_=_'unknown';______try_{______bar();_____}_catch_(err)_{______new_Baz();______outcome_=_'exception';______}_finally_{______return;______console.log(outcome);_____}____} (invocation 1).
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
function foo() {
				let outcome = 'unknown';

				try {
					bar();
				} catch (err) {
					new Baz();
					outcome = 'exception'; 
				} finally {
					return;
					console.log(outcome);
				}
			}