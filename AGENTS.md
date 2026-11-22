# LateForClass development guidelines

## Project overview

LateForClass is a first-person browser game built with JavaScript, HTML, CSS, and Three.js. A static HTTP server serves the game and its JSON level data. The game has one entry point in `js/main.js` and runs without a build step.

## Naming conventions

| Element | Convention | Example |
| --- | --- | --- |
| Project and repository | Exact project name | `LateForClass` |
| Classes and class filenames | PascalCase | `Player`, `Player.js` |
| Variables, functions, methods, and object properties | camelCase | `playerPosition`, `createWalls()` |
| Constants | UPPER_SNAKE_CASE for fixed values | `STARTING_LEVEL_ID` |
| JSON properties | camelCase | `playerStart` |
| HTML IDs and CSS classes | kebab-case | `start-screen`, `.start-button` |
| Directories | Lowercase | `js/`, `assets/`, `tests/` |

Use exact filename casing in every script reference and import. Prefer descriptive names and consistent terminology. Use camelCase for local computed values declared with `const`. Retain existing private-field conventions and clear names.

## Architecture rules

- **Game** owns initialization, the scene, renderer, game loop and state. It loads the current level and coordinates components.
- **Player** owns player position and orientation, movement input, velocity, gravity, collision response, and the camera.
- **Level** builds the objects defined in `assets/levels.json`. It owns walls, pillars, collision queries, environmental information, and cleanup.
- **Wall** encapsulates one wall's dimensions, bounds, and collision query.

Give each class a clear responsibility. Extend the appropriate existing class first. Introduce a class only when its responsibility warrants it. Keep browser rendering, game state, player physics, and level data separate. Avoid circular dependencies and unnecessary global state.

The first-person camera uses world-up Y, explicit yaw and pitch, and zero roll. All orientation changes must pass through the Player's camera rotation method. Camera initialization, restart, and mouse movement must use the same orientation model. Any changes to camera controls must pass the camera rotation regression tests.

## Coding standards

Use four-space indentation, single quotes in JavaScript, semicolons, and braces for control-flow blocks. Use `const` by default and `let` for reassignment. Prefer straightforward control flow, descriptive names, and comments that explain decisions or algorithms. Keep the vanilla JavaScript setup and add dependencies only when the task requires them.

Report load failures to the player and retain the underlying error in the console for debugging. Keep a failed startup disabled. Handle recoverable input errors, such as denied pointer lock, through the existing game interface.

## Development workflow

1. Inspect the relevant code and understand its architecture before proposing changes.
2. Make the smallest reasonable change and preserve working behavior unless the task asks to change it.
3. Keep unrelated refactoring out of feature work. Update all affected references when moving or renaming files.
4. Run the available tests after editing. Add or update coverage when functionality changes.
5. Update `CHANGELOG.md` whenever code or project structure changes. Record the scope, reason, verification, and remaining issues.
6. Review the final diff and report what changed and what you could verify.

## Milestone approval

[VISION.md](VISION.md) defines the product direction and may be changed only with the product owner's approval. [ROADMAP.md](ROADMAP.md) records completed work, current progress, and proposed milestones.

- The product owner makes game-design decisions and approves milestones. Codex handles technical analysis, implementation, and testing.
- An approval applies only to the specific proposed milestone and its agreed scope. Wait for explicit approval before implementing a proposal. The product owner may reject, change, or reprioritize any proposal.
- Stop and ask the product owner if implementation raises a significant new design decision or scope change. Resume once that decision has been made.
- When the product owner asks “What's next?”, review the vision, roadmap, source, and current state. Present the highest-priority milestone, why it matters, and its acceptance criteria. Wait for approval.
- When the product owner says “Approved”, implement only the unambiguously identified milestone. Update its roadmap status, run the relevant tests, and fix regressions. After verification, update `CHANGELOG.md` and `ROADMAP.md`, report what changed and what was verified, and propose exactly one next milestone. Stop and wait for approval before starting it.
- When the product owner rejects or changes a proposal, revise the proposal and wait for approval before coding. Ask for clarification if approval could refer to more than one proposal.
- Commit or push only with explicit authorization to do so.

## Testing guidelines

Run `node tests/movement/run-tests.js` from the repository root. Serve the repository with `python3 -m http.server 8090`, then visit `/tests/movement/` on that server for the shared tests with Three.js. For changes to startup, rendering, or input, also exercise the game at `/` in a desktop browser. Check startup and the console, movement and pointer lock, collisions, level geometry, and reset behavior as relevant. Report only tests that ran.

## Git guidelines

Preserve uncommitted work. Keep changes focused and logically grouped. Avoid destructive Git operations. Use an intermediate `git mv` for case-only renames when necessary and verify the exact names in the Git index. Commit or push only when explicitly requested.
