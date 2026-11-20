
# Development Rules — Late for Class

## Mandatory Change Log

Maintain a CHANGELOG.md file in the project root.

Every time you modify the project, you MUST update
CHANGELOG.md before declaring the task complete.

For each completed change, record:

- Date (YYYY-MM-DD)
- A short description of the change
- Files added, modified, or deleted
- Reason for the change
- Bugs fixed or features implemented
- Tests performed and their results
- Known limitations or remaining issues

## Change Log Format

Use reverse chronological order (newest entries first).

Group related file modifications into one logical change.

Do not create a separate entry for every minor edit
made while working on the same task.

## Development Discipline

1. Inspect the relevant existing code before editing.
2. Preserve existing functionality unless explicitly
   instructed otherwise.
3. Make focused, explainable changes.
4. Run relevant tests after modifying code.
5. Verify actual behavior whenever possible.
6. Update CHANGELOG.md before finishing.
7. Never claim testing succeeded unless it was executed.
8. Never claim a file was modified without verifying it.

## Completion Requirements

Before declaring a task complete:

- Review the actual changes using git diff.
- Run relevant tests.
- Update CHANGELOG.md.
- Summarize the changes and verification results.

A coding task is not complete until the change log
has been updated.
