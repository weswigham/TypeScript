/// <reference lib="esnext.asynciterable" />
// Must reference esnext.asynciterable lib, since octokit uses AsyncIterable internally
import cp = require("child_process");
import Octokit = require("@octokit/rest");

const opts = { timeout: 100_000, shell: true, stdio: "inherit" }
function runSequence(tasks: [string, string[]][]) {
    for (const task of tasks) {
        console.log(`${task[0]} ${task[1].join(" ")}`);
        const result = cp.spawnSync(task[0], task[1], opts);
        if (result.status !== 0) throw new Error(`${task[0]} ${task[1].join(" ")} failed: ${result.stderr && result.stderr.toString()}`);
    }
}

function padNum(number: number) {
    const str = "" + number;
    return str.length >= 2 ? str : "0" + str;
}

const userName = process.env.GH_USERNAME;
const reviewers = ["weswigham", "sandersn", "RyanCavanaugh"];
if (process.env.requesting_user && reviewers.indexOf(process.env.requesting_user) === -1) {
    reviewers.push(process.env.requesting_user);
}
const now = new Date();
const branchName = `user-update-${process.env.TARGET_FORK}-${now.getFullYear()}${padNum(now.getMonth())}${padNum(now.getDay())}${process.env.TARGET_BRANCH ? "-" + process.env.TARGET_BRANCH : ""}`;
const remoteUrl = `https://${process.argv[2]}@github.com/${userName}/TypeScript.git`;
runSequence([
    ["git", ["checkout", "."]], // reset any changes
    ["node", ["./node_modules/gulp/bin/gulp.js", "baseline-accept"]], // accept baselines
    ["git", ["checkout", "-b", branchName]], // create a branch
    ["git", ["add", "."]], // Add all changes
    ["git", ["commit", "-m", `"Update user baselines"`]], // Commit all changes
    ["git", ["remote", "add", "fork", remoteUrl]], // Add the remote fork
    ["git", ["push", "--set-upstream", "fork", branchName, "-f"]] // push the branch
]);

const gh = new Octokit();
gh.authenticate({
    type: "token",
    token: process.argv[2]
});
gh.pulls.create({
    owner: process.env.TARGET_FORK,
    repo: "TypeScript",
    maintainer_can_modify: true,
    title: `🤖 User test baselines have changed` + (process.env.TARGET_BRANCH ? ` for ${process.env.TARGET_BRANCH}` : ""),
    head: `${userName}:${branchName}`,
    base: process.env.TARGET_BRANCH || "master",
    body:
`${process.env.source_issue ? `This test run was triggerd by a request on https://github.com/Microsoft/TypeScript/pull/${process.env.source_issue} `+"\n" : ""}Please review the diff and merge if no changes are unexpected.
You can view the build log [here](https://typescript.visualstudio.com/TypeScript/_build/index?buildId=${process.env.BUILD_BUILDID}&_a=summary).

cc ${reviewers.map(r => "@" + r).join(" ")}`,
}).then(async r => {
    const num = r.data.number;
    console.log(`Pull request ${num} created.`);
    await gh.pulls.createReviewRequest({
        owner: process.env.TARGET_FORK,
        repo: "TypeScript",
        number: num,
        reviewers,
    });
    if (process.env.source_issue) {
        await gh.issues.createComment({
            number: +process.env.source_issue,
            owner: "Microsoft",
            repo: "TypeScript",
            body: `The user suite test run you requested has finished and _failed_. I've opened a [PR with the baseline diff from master](${r.data.html_url}).`
        });
    }
}).then(() => {
    console.log(`Reviewers requested, done.`);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
