// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-unused-private-class-members/class_Foo_{_____#unusedInAssignmentPattern;_____method()_{_________[this.#unusedInAssignmentPattern]_=_bar;_____}_} (invocation 1).
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
            "no-unused-private-class-members": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
class Foo {
    #unusedInAssignmentPattern;
    method() {
        [this.#unusedInAssignmentPattern] = bar;
    }
}