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
    const changedFilesCount = github.context.payload.pull_request.changed_files || 0;

    const errors = [];

    // Rule 1: Description length
    if (!description || description.length < 20) {
      errors.push("Pull request must have a description of at least 20 characters");
    }

    // Rule 2: Title starts with ticket number
    const ticketPattern = /^[A-Z]+-\d+\s+/;
    if (!ticketPattern.test(title)) {
      errors.push("Pull request title must start with a ticket number (e.g. PROJ-123)");
    }

    // Load file list using GitHub API
    const token = core.getInput("github_token");
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const prNumber = pr.number;

    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber
    });

    // Rule 3: Changed files < 5
    if (files.length >= 5) {
      errors.push("Pull request must contain fewer than 5 files");
    }

    // Rule 4: No package-lock.json
    const fileNames = files.map(file => file.filename);
    if (fileNames.includes("package-lock.json")) {
      errors.push("Pull request must not include changes to `package-lock.json`");
    }

    if (errors.length > 0) {
      core.setFailed("❌ Pull request validation failed:\n" + errors.join("\n"));
    } else {
      console.log("✅ Pull request passed all checks!");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
