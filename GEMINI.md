# Gemini Workflow

This document outlines the development workflow and conventions for this project.

## Development Workflow

Before committing any changes, please ensure that you have run the following checks:

1.  **Lint:** `npm run lint`
2.  **Type Check:** `npm run typecheck`
3.  **Tests:** `npm test`

These checks will help ensure that the code is clean, correct, and free of errors.

### Pre-commit Hook (Recommended)

To automate these checks, you can use a pre-commit hook. This will ensure that the checks are always run before a commit is made.

You can set up a pre-commit hook using a tool like `husky`. Here's an example of how you can configure it:

1.  Install `husky`: `npm install husky --save-dev`
2.  Enable Git hooks: `npx husky`
3.  Create a pre-commit hook: `npx husky add .husky/pre-commit "npm run lint && npm run typecheck && npm test"`

## Commit Messages

When creating a commit message, please follow these guidelines:

*   Use the imperative mood (e.g., "add feature" not "added feature").
*   Keep the subject line short and descriptive.
*   Use the body of the commit message to provide more context, if necessary.

**Note:** You do not need to confirm the commit message with me. Please create a commit message that you think is appropriate and commit the changes directly.
