# LateForClass development roadmap

Product direction lives in [VISION.md](VISION.md). This roadmap records the implementation baseline and ranks proposed milestones. Each proposal requires separate product-owner approval under the [development workflow](AGENTS.md#milestone-approval).

## Status

| Status | Meaning |
| --- | --- |
| Proposed | Awaiting the product owner's decision |
| Approved | The product owner has approved this specific scope and acceptance criteria |
| In Progress | Implementation of the approved scope is under way |
| Completed | Implementation and verification are recorded |
| Rejected | The product owner declined the proposal |

## Completed milestones

| Milestone | Status | Acceptance and evidence |
| --- | --- | --- |
| Browser prototype and hallway loop | Completed | The default level starts, supports pause and restart, and completes when the player presses E in range of the classroom marker. |
| Data-driven engine foundation | Completed | Game, Player, Level, and Wall have separate responsibilities. The original hallway loads from JSON and renders twelve outer edges and ten pillars. |
| Movement, jumping, and collision | Completed | Camera-relative WASD, grounded Space jumps, gravity, wall sliding, and floor, ceiling, and platform contact have automated coverage. |
| First-person camera consistency | Completed | Spawn, mouse look, and restart share yaw and pitch with zero roll. Tests cover the world-space horizon, full turns, and reset. |
| Physics Playground and stairs | Completed | The development scene is selectable at `/?level=2`. The gap, stair ascent and descent, ledge fall, restart, and matching wireframe and collision bounds passed the recorded Chrome checks. This milestone is in the local working tree. |
| 1. Connect one corridor and one classroom | Completed | The data-defined scene opens at `/?level=3`. Chrome verified walking through the opening in both directions at floor height, collision beside it, and R restoring spawn and view. Targeted tests cover both sides of the doorway and player clearance. |
| Development level picker | Completed | `/levels/` lists levels by name from the level data. Chrome verified navigation to each current level and back. |
| 2. Add one interactive door | Completed | The data-defined door in `/?level=3` starts closed, opens with E in range from either side, and closes on R. Tests and Chrome verified traversal and matching panel and collision bounds. |
| 3. Connect two floors by stairs | Completed | Twelve data-defined stairs connect the classroom to an upper landing. Tests verify grounded traversal at two frame rates, head clearance, and landing boundaries. A Chrome playthrough used every tread up and down. |

The two-floor route passed 51 Node tests and 42 Chrome regression tests. The default hallway and Physics Playground retained their existing routes and level definitions. [CHANGELOG.md](CHANGELOG.md)

## Known bugs and limitations

- The earlier camera pitch snap was fixed and has regression coverage. The reported intermittent sideways roll was not reproduced in the stock hallway during the prior investigation. The current Node run passed the camera tests. [CHANGELOG.md](CHANGELOG.md)
- The default hallway's classroom prompt checks horizontal distance to a point. Corridor and Classroom exercises door interaction and two-floor traversal. A classroom objective in the connected layout remains a proposed milestone. [Game.js](js/Game.js) · [Level.js](js/Level.js)
- The playground uses static, axis-aligned boxes and discrete stair treads. A fall into its pit is recoverable with R. [README.md](README.md)
- The current build requires a desktop browser with WebGL, Pointer Lock, and access to the Three.js CDN. [README.md](README.md)

## Proposed milestones in priority order

### 4. Complete one classroom objective in the connected layout

**Status** Proposed

Add one arrival objective to Corridor and Classroom. The proposed destination is a marked area inside the existing lower-floor classroom. Pressing E in that area completes the run.

Acceptance criteria

- The level defines the destination and its floor height. The player sees the objective while exploring and a completion prompt within the destination area.
- E completes the run only within that area. The door remains usable, and R resets the objective and door for another attempt.
- Automated tests and a browser playthrough verify successful arrival, interaction outside the target area, and restart.
- Timing, scoring, and navigation aids require their own design decisions before entering an approved scope.

### 5. Validate one approved visual treatment

**Status** Proposed

Apply a product-owner-approved visual direction to one playable corridor and classroom. Use the result to evaluate readability before applying it to a wider campus.

Acceptance criteria

- A browser playthrough shows the approved treatment on the sample route. The doorway and any required route cues are distinguishable during play.
- Movement, collision, and completion on the route pass the existing regressions.
