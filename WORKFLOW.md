# Codex Workflow

Follow this workflow for every implementation task.

1. Read `ROADMAP.md`, `WORKFLOW.md`, and `QUALITY_GATES.md` before starting.
2. Select exactly one unchecked step from `ROADMAP.md`: the first incomplete step unless the user explicitly requests another step.
3. Before editing, summarize the plan:
   - selected step
   - files expected to change
   - files that must not change
   - verification commands
4. Edit only files allowed by the selected step.
5. Do not implement features outside the selected step.
6. Do not use official game names, official images, official board layouts, official token designs, or copied rulebook text.
7. After implementation, run the required verification commands:
   - `npm run lint`
   - `npm run build`
   - `npm run test` when tests exist or when puzzle logic changes
8. If verification passes, update `ROADMAP.md` by checking only the completed step.
9. If verification fails, do not check the step. Summarize:
   - command that failed
   - error message
   - likely cause
   - files changed so far
10. Stop after one step. Do not proceed to the next roadmap step automatically.

## Scope Rules

- One roadmap step per task.
- No opportunistic refactors.
- No package changes unless the selected step allows them.
- No solver or movement behavior changes unless the selected step explicitly allows them.
- If unexpected existing changes are present, preserve them and work around them.

## Completion Response

End each task with:

- files changed
- what was implemented
- verification commands and results
- whether `ROADMAP.md` was updated
- next recommended step
