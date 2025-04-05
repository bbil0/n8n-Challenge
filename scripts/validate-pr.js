const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const pr = github.context.payload.pull_request;
    if (!pr) {
      core.setFailed("No pull request found in the context.");
      return;
    }

    const title = pr.title || "";
    const description = pr.body || "";

    const summary = {
      rules: {
        descriptionLength: false,
        noPackageLock: false,
        fileCountLimit: false,
        titleHasTicket: false,
      },
      valid: false
    };

    // Rule 1: Description length
    summary.rules.descriptionLength = description.length >= 20;

    // Rule 2: Title starts with ticket number
    const ticketPattern = /^[A-Z]+-\d+\s+/;
    summary.rules.titleHasTicket = ticketPattern.test(title);

    // Rule 3 & 4: Fetch PR files
    const token = core.getInput("github_token");
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const prNumber = pr.number;

    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber
    });

    const changedFileNames = files.map(file => file.filename);

    // Rule 3: Fewer than 5 files
    summary.rules.fileCountLimit = files.length < 5;

    // Rule 4: package-lock.json not included
    summary.rules.noPackageLock = !changedFileNames.includes("package-lock.json");

    // Final result
    summary.valid = Object.values(summary.rules).every(Boolean);

    // Print JSON to console
    console.log("🔎 Pull Request Rule Summary:");
    console.log(JSON.stringify(summary, null, 2));

    if (!summary.valid) {
      core.setFailed("❌ Pull request does not comply with all rules.");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
