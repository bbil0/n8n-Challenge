// Function to validate PR rules
function validatePR(prPayload) {
    const errors = [];

    // Rule 1: Description must be at least 20 characters
    if (!prPayload.body || prPayload.body.length < 20) {
        errors.push("❌ Pull request must have a description of at least 20 characters.");
    }

    // Rule 2: Must not include changes to package-lock.json
    if (prPayload.changedFiles.includes("package-lock.json")) {
        errors.push("❌ Pull request must not include changes to package-lock.json.");
    }

    // Rule 3: PR must contain fewer than 5 files
    if (prPayload.changedFiles.length >= 5) {
        errors.push("❌ Pull request must contain fewer than 5 files.");
    }

    // Rule 4: Title must start with a ticket number (e.g., PROJ-123)
    if (!/^[A-Z]+-\d+/.test(prPayload.title)) {
        errors.push("❌ Pull request title must start with a ticket number (e.g. PROJ-123).");
    }

    return errors.length > 0 
        ? { valid: false, errors } 
        : { valid: true, message: "✅ PR is valid and follows all rules!" };
}

// Extract PR payload from input JSON data (Webhook)
const prPayload = {
    title: $json["pull_request"]["title"],
    body: $json["pull_request"]["body"],
    changedFiles: $json["pull_request"]["files"].map(file => file.filename) || [] 
};

// Run validation
const validationResult = validatePR(prPayload);

// Return the validation result
return [{ validationResult }];