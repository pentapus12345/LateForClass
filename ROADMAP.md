# LateForClass development roadmap

The product direction is defined in [VISION.md](VISION.md). This roadmap records completed work and proposes the next milestones. Under [AGENTS.md](AGENTS.md), **each proposed milestone requires separate product-owner approval before implementation**. Editing this roadmap does not approve a milestone.

## Status definitions

| Status | Meaning |
| --- | --- |
| Proposed | Awaiting the product owner's decision |
| Approved | The product owner approved this specific scope |
| In Progress | Approved work is being implemented |
| Completed | Implementation and verification are recorded |
| Deferred | The product owner set this milestone aside for later |
| Rejected | The product owner declined this proposal |

## Completed development baseline

Each entry records the result and verification for its milestone.

| Milestone or foundation | Status | Recorded result |
| --- | --- | --- |
| Browser prototype and hallway | Completed | Starts, pauses, restarts, and supports the initial E-to-complete marker objective. |
| Data-driven engine | Completed | Game, Player, Level, and Wall responsibilities separated; JSON hallway with 12 outer edges and 10 pillars. |
| Movement, gravity, jumping, collisions | Completed | Camera-relative movement, grounded jumps, gravity, sliding, and floor/ceiling/platform collisions covered by tests. |
| First-person camera consistency | Completed | Unified yaw/pitch, zero roll, and camera reset; regression coverage. |
| Physics Playground and stairs | Completed | `/?level=2`; gap, ascent/descent, ledge fall, and geometry/collision checks recorded. |
| 1. Connected corridor and classroom | Completed | `/?level=3`; traversable doorway, collision beside opening, and reset verified. |
| Development level picker | Completed | `/levels/` lists available levels. |
| 2. Interactive door | Completed | Open with E from either side; restart closes it; collision matches door state. |
| 3. Two floors connected by stairs | Completed | Twelve data-defined steps; ascent/descent and landing tested. |
| 4. Classroom objective prototype | Completed | Green-marker/E interaction validated in Room 101; superseded by milestone 7. |
| 4. Classroom identity and arrival | Completed | Room 101 signage linked to a floor-specific arrival target, with E confirmation. |
| 4.5. Visual foundations | Completed | Solid Corridor and Classroom view and V collision-outline toggle; geometry and controls checked. |
| 5. Player schedule panel | Completed | Class, room, and scheduled start time displayed; 58 Node and 46 Chrome tests recorded. |
| 6. Configurable controls and options | Completed | Two keyboard layouts, mouse settings, optional click-to-jump, saved preferences, defaults, menu; 65 Node and 50 Chrome tests recorded. |
| [7. Automatic classroom arrival through the doorway](#7-automatic-classroom-arrival-through-the-doorway) | Completed | The scheduled room registers arrival after full doorway clearance. All 66 Node and 50 Chrome tests passed. Chrome verified threshold and floor bounds, correct and wrong rooms, and restart. |
| [8. Accelerated school clock and deadline](#8-accelerated-school-clock-and-deadline) | Completed | At 60×, the prototype gives 60 active seconds before class. All 72 Node and 52 Chrome tests passed. Chrome verified a win, pause, the full timeout, and retry. |
| [9. Multiple numbered classrooms](#9-multiple-numbered-classrooms) | Completed | Rooms 101, 102, and 103 are reachable and labeled. Chrome verified all three scheduled routes, a live clock after wrong-room entry, and door reset. All 74 Node and 54 Chrome tests passed. |
| 9.5. Encapsulate game session and user interface | Completed | `GameSession` owns run state and `GameUI` owns presentation. All 77 Node and 56 Chrome tests passed. Chrome verified all three rooms, Options, debug view, pause, the full timeout, and Retry. |
| [10. Discoverable room-numbering logic](#10-discoverable-room-numbering-logic) | Completed | Approved corridor map and signs implemented. All 78 Node and 57 Chrome tests passed. Scripted routes used both approaches and verified all three room IDs. First-time player comprehension remains a playtesting item. |
| [10.5. Multi-floor school prototype](#105-multi-floor-school-prototype) | Completed | Six classrooms connect through a signed public stair route. All 82 Node and 59 Chrome tests passed. Browser walkthroughs verified destinations on both floors, wrong-floor entry, timeout, and Retry. |
| [11. First complete playable class-navigation challenge](#11-first-complete-playable-class-navigation-challenge) | Completed | The initial default challenge used Room 102, with Room 002 as the alternate test target. All 82 Node and 59 Chrome tests passed. Chrome verified both routes, a wrong-room visit, the stock timeout, and reset. |
| [11.5. Reusable environmental objects and furniture](#115-reusable-environmental-objects-and-furniture) | Completed | Six types load from level data and appear in Room 003 and the ground-floor corridor. All 86 Node and 63 Chrome tests passed, including solid collisions, debug outlines, rebuild cleanup, and the upstairs route. |
| [11.6. Lighting and shadow foundation](#116-lighting-and-shadow-foundation) | Completed | One shadow-casting directional light and three fixtures demonstrate the configurable system. All 88 Node and 65 Chrome tests passed. Chrome verified moving door shadows, readable routes, debug mode, and restart cleanup. |

For historical change details and exact test evidence, see [CHANGELOG.md](CHANGELOG.md).

### 7. Automatic classroom arrival through the doorway

**Status:** Completed

**Complexity:** Medium

**Objective:** Replace the E-to-complete arrival mechanic with physically entering the scheduled classroom.

**Contribution to the vision:** Makes finding and entering the correct room the central objective.

**Scope:**

- Define classroom boundaries/arrival volumes, room IDs, and door-to-room associations in level JSON, reusing existing definitions where possible.

- E still opens interactive doors. Crossing into the correct classroom completes the objective automatically, without an arrival keypress or green destination marker.

- Match the entered room to the scheduled `roomId`; do not hardcode Room 101 or arrival coordinates in Game.

- Use three-dimensional room containment with floor-height validation. Simply standing by a closed door, touching the threshold while still outside, or standing on another floor does not count.

- Entering another classroom must not finish the level. Preserve door, collision, camera, stair, and reset behavior.

**Dependencies:** Completed classroom identity, connected-room geometry, interactive doors, and schedule panel (milestones 2, 4, and 5).

**Acceptance criteria:**

- Open the scheduled classroom's door with E and walk inside to win automatically; no separate E press to complete.

- Outside the room, at the doorway but still outside, or on another floor does not count.

- Changing the scheduled room identifier in level data changes which room qualifies; a wrong-room entry does not win.

- Restart resets doors and the objective. Existing tests pass and new Node/browser tests verify spatial entry and boundary conditions.

**Constraints:** No clock, deadline, new school layout, or additional features in this milestone. Follow AGENTS.md and update CHANGELOG.md. Do not commit or push automatically.

### 8. Accelerated school clock and deadline

**Status:** Completed

**Complexity:** Medium

**Objective:** Run a simulated school clock at a configurable speed, default **60×**, and end the level in failure if the player has not entered the correct classroom before class starts.

**Contribution to the vision:** Introduces the game's defining time pressure, with a clear success or failure outcome.

**Scope:**

- Put the starting school time, clock speed, scheduled class name, destination room ID, and class start time in level JSON. Reuse the existing schedule schema instead of keeping duplicates. One illustrative shape is:

  ```json

  {

    "clock": { "startTime": "08:00", "timeScale": 60 },

    "schedule": {

      "className": "Mathematics",

      "roomId": "101",

      "startTime": "09:00"

    }

  }

  ```

- The current school time is prominently visible alongside the existing schedule information. The displayed time and deadline logic share one authoritative simulation clock, independent of the system clock.

- Advance time based on active gameplay elapsed time, independent of frame rate. At 60×, one real second equals one school minute and one real minute equals one school hour.

- Pause simulated time whenever gameplay is paused/suspended, including menu and focus/pointer-lock interruption, without unintended time loss or gain.

- Entering the correct room **strictly before** class starts wins. Reaching the class time without arrival immediately loses and displays an unmistakable **You're Late!** result with a Retry button.

- Once won or lost, freeze the outcome; retry restores spawn, clock, doors, scheduled objective, and other initial level state.

**Dependencies:** Milestone 5 schedule display and **milestone 7 automatic classroom arrival**; existing pause/restart lifecycle.

**Acceptance criteria:**

- With start 08:00, class 09:00, and timeScale 60, the deadline occurs after exactly 60 seconds of active real time. After 10 seconds, school time is 08:10.

- Entering the correct classroom before the deadline wins; at the deadline, it loses. Failure is automatic without a keypress.

- The clock pauses and resumes correctly; reload/retry starts from the configured state. A final result cannot be reversed by later input.

- Changing the level JSON's start time, class time, class name, destination room, or multiplier updates game behavior and display without code changes.

- Tests cover time scaling, frame-rate independence, pause/resume, exact deadline boundaries, success, failure, and reset. A browser playthrough demonstrates a win and a timeout loss.

**Constraints:** One class and one deadline per run. No scoring, multi-class progression, new geometry, or art redesign. Preserve debug view and current controls. Follow AGENTS.md and update CHANGELOG.md. Do not commit or push automatically.

### 9. Multiple numbered classrooms

**Status:** Completed

**Complexity:** Medium

**Objective:** Make the scheduled destination one of several reachable, visibly numbered classrooms.

**Contribution to the vision:** Introduces meaningful destination choices rather than a single obvious room.

**Scope:** Extend one connected school layout with a small set of data-defined classrooms, each with a unique visible ID, doorway/door association, and three-dimensional arrival volume. Ensure level JSON is the source of truth for identity, signage, room geometry, door associations, schedule targets, and arrival validation. Preserve existing doors and floors; one scheduled class remains active.

**Dependencies:** Milestone 7 automatic arrival, milestone 5 schedule, and milestone 8 deadline for a timed playtest.

**Acceptance criteria:** Every classroom is reachable and correctly labeled in solid view; wrong-room entry leaves the objective active; changing the scheduled `roomId` changes the winning room without code changes; room labels, door associations, and arrival volumes agree with level data; the timer continues normally; navigation and collision tests pass.

### 9.5. Encapsulate game session and user interface

**Status:** Completed

**Complexity:** Medium–Large

**Objective:** Reduce the responsibilities of `Game.js` through a focused, behavior-preserving refactor before the school and navigation mechanics become more complex.

**Contribution to the vision:** Keep the game's growing schedule, arrival, timing, controls, and presentation systems testable and maintainable without changing how LateForClass plays.

**Rationale:** Before the refactor, `Game.js` combined startup, scene rendering, browser input, session outcomes, and interface updates. `SchoolClock.js` already encapsulated simulated time, and `controls.js` already handled mappings and settings. The refactor reused both modules.

**Scope:**

1. Audit `Game.js` and the supporting modules. Briefly document the proposed ownership boundaries, state flow, and dependencies before editing code.

2. Introduce a cohesive `GameSession` (or equivalently named) component to own session lifecycle state, clock coordination, scheduled-room outcome evaluation, and restart/reset of session state. **Compose the existing `SchoolClock`** instead of duplicating or rewriting its timing logic. `Level` remains the authority for room geometry and which room the player has entered; the session decides whether that room satisfies the schedule and deadline.

3. Introduce a `GameUI` (or equivalently named) component to own DOM references and presentation of start/pause, options, schedule, clock, objective, controls status, view status, and win/loss screens. UI renders state supplied by the game/session; it does not decide whether the player won or lost.

4. Keep the existing `controls.js` functions for action mapping and settings persistence. Review input event wiring and extract it only if doing so materially simplifies ownership; do not add an `InputController` merely to shorten `Game.js`. Preserve the existing `Player` input and physics responsibilities.

5. Keep `Game` as a thin coordinator of level loading, Three.js scene/renderer, player and level creation, event coordination, game loop, and updates. Avoid turning it into a service locator or merely moving large methods unchanged into extra files.

6. Establish one source of truth for the running/paused/won/lost state, clock lifecycle, active schedule, and arrival result. Do not introduce parallel booleans or diverging clock states in different components.

7. Preserve the current vanilla JavaScript/no-build setup and browser script-loading order. Maintain `AGENTS.md` naming and architecture conventions, updating its component-responsibility descriptions to reflect the implemented architecture **after** the approved refactor.

8. Refactor in small steps, running targeted tests after each extraction. Update `README.md`'s architecture section and `CHANGELOG.md` once implementation is verified.

**Dependencies:** Completed milestones 5–9 and existing `SchoolClock.js`, `controls.js`, `Player.js`, and `Level.js`. This refactor does not depend on choosing the room-numbering pattern for milestone 10.

**Acceptance criteria:**

- `Game.js` primarily coordinates the application; session rules and DOM presentation have clear, independently testable owners.

- `SchoolClock.js` remains the authoritative simulated-clock implementation; there are no duplicate timers, control mappings, or result-state owners.

- Session logic can be tested without rendering a Three.js scene or constructing browser DOM elements. UI behavior is tested with appropriate DOM/browser tests.

- Strict deadline semantics are preserved: entering the correct room **before** class time wins, reaching the deadline first loses, and once determined the result cannot change. The same update-order rule is applied and tested at the exact boundary.

- Pausing via Escape, Options, focus loss, visibility changes, and pointer-lock loss continues to stop simulated time correctly; Resume continues without time jumps.

- The schedule, current time, room objective, menu/options controls, Restore Defaults, `V` view toggle, configurable input schemes, E doors, jumping, and restart work exactly as before.

- All three numbered classrooms can still be scheduled by changing level JSON; incorrect-room entry keeps the clock running; correct-room entry wins without an extra keypress.

- All existing Node and Chrome regression tests pass, with new targeted tests for the extracted session and UI boundaries. Browser playthroughs verify startup, normal navigation, win, timeout, retry, pause/resume, options, and debug view.

- The refactor does not change geometry, visual appearance, physics, gameplay rules, control defaults, levels, or timing behavior.

**Constraints:** Refactoring only; no new features or level content. Prefer composition and a small number of cohesive modules. Do not introduce a framework, build step, event bus, dependency-injection container, or new timer implementation. Do not refactor `Level.js` or `Player.js` beyond adjustments needed to integrate the new boundaries. Respect the approval process in `AGENTS.md`; do not commit or push automatically.

**Implementation note:** Start by extracting UI rendering and session state into testable components while leaving the existing game running between steps. If a proposed extraction proves artificial or would increase coupling, retain it in `Game` and explain the tradeoff. The target is clear ownership, not an arbitrary line-count limit.

**Ownership and state flow:** `Game` translates browser focus, visibility, Pointer Lock, and menu events into play access. It checks the session deadline before updating `Player`, then passes the room reported by `Level` to `GameSession`. The session owns the run phase, schedule, and arrival result and composes `SchoolClock`. `GameUI` presents the session state and interaction prompts and publishes menu actions. `Game` applies settings using the existing `controls.js` functions. Browser input remains in `Game` because it shares the same event and lifecycle coordination.

### 10. Discoverable room-numbering logic

**Status:** Completed

**Complexity:** Medium

**Objective:** Establish and demonstrate a consistent, learnable room-numbering convention before expanding the school.

**Contribution to the vision:** Make room numbers useful navigational information rather than arbitrary labels or a sequence that only happens to make sense from one approach.

**Approved convention**

- A three-digit identifier uses its first digit for the floor: `0xx` for ground floor, `1xx` for first floor, and `2xx` for second floor if that floor is introduced later.
- The remaining digits increase along the corridor from the fixed origin behind the spawn. Ties at the same distance from the origin use east first, then west.
- The origin sign describes the route facing away from the origin. The far-end sign describes the route facing back toward it. Both signs and their room directions are defined in level JSON.
- Mathematics still takes place in the classroom at the far end, now labeled Room 103. The prototype uses Floor 1 labels. Ground-floor relabeling belongs to the separately approved two-floor map.

```text
                       [103 · Far end]
                              │
     [101 · East, +X] ─── corridor ─── [102 · West, −X]
                              │
                            Spawn
                              ↑ +Z away from the origin
                       [Fixed origin]
```

**Scope:** Review the current level data and corridor geometry; propose the exact room order, starting reference point, and minimal signs; obtain approval of that map; then implement the convention and signage in the existing layout. Do **not** add a new floor, extend the staircase, or build additional classrooms in this milestone.

**Dependencies:** Completed milestones 9 and 9.5; explicit product-owner approval of the numbering convention and exact positions before coding.

**Acceptance criteria:**

- A documented room-ordering rule and layout sketch identify the fixed origin and the positions of all current classrooms.
- Room numbers, signs, doors, arrival volumes, and scheduled targets agree with the level JSON.
- The same rule remains understandable when a corridor is approached from either end.
- A player can use in-world clues to find at least two scheduled rooms without an objective marker or prior knowledge of the layout.
- Existing controls, camera, collisions, doors, clock, win/loss logic, restart, solid view, and V debug view remain correct; Node and Chrome regression tests pass.

**Constraints:** Keep the current floor and geometry footprint unless minor sign placements require changes. Do not expand the school, introduce new navigation aids beyond approved signage, or change time rules. Follow AGENTS.md; do not commit or push automatically.

### 10.5. Multi-floor school prototype

**Status:** Completed

**Complexity:** Medium–Large

**Objective:** Extend the connected school to **two usable floors** so the first digit of the room number becomes meaningful to navigation.

**Contribution to the vision:** Turn room-number inference into a genuinely three-dimensional wayfinding challenge involving floors, staircases, and room ordering.

**Approved layout**

| Floor | Fixed origin | East door | West door | Far-end door |
| --- | --- | --- | --- | --- |
| Ground | Corridor end behind spawn | 001 | 002 | 003 |
| First | Upper stair landing | 101 | 102 | 103 |

The public passage branches west before Room 003 and wraps behind it to the stair base. The existing flight and landing moved 2.5 world units along the stairwell to fit a flat approach. The upper corridor starts at the landing. Both floors number paired rooms east first. The default Mathematics schedule follows the original classroom to Room 003.

**Scope:**

- Build on the existing corridor, first-floor/ground-floor numbering convention, staircase, and upper landing. Extend the layout into a playable corridor on the second accessible floor; do not build a third floor yet.
- Provide a small, purposeful set of classrooms across the two floors (for example, three on each), each with data-defined identity, visible signage, door association, colliders, and 3D arrival region.
- Use `0xx` on the ground floor and `1xx` on the first floor, with the approved fixed-origin ordering on each floor. Renumber existing `101`–`103` rooms only through an approved migration of their sign and level-data associations.
- Add simple in-world floor and stair-direction signs that let the player determine where to go without an objective marker.
- Reuse the current Level/Player/GameSession/GameUI architecture and the solid/debug rendering pair. Keep visual geometry and collision bounds aligned.
- Keep the school on a **single scheduled class per attempt**, with the existing JSON-defined start time, target room, 60× clock default, success, failure, and retry rules.

**Dependencies:** Milestone 10 completed, including approved numbering rules; the existing stair, door, classroom, camera, clock, and collision systems.

**Acceptance criteria:**

- The player can walk between both floors using stairs, without teleporting or jumping over normal steps.
- Classrooms on both floors are independently reachable, correctly labeled, and recognized by their matching arrival regions.
- Changing `schedule.roomId` in level JSON selects a valid target on either floor without modifying game logic.
- Entering a wrong-floor or wrong-room classroom does not win; entering the correct room before the deadline wins; timeout loses.
- A first-time player can use floor and corridor signs to infer which staircase and direction to take for a scheduled destination.
- Both visual modes remain correct and collisions, pointer lock, pause, retry, door reset, and school-clock behavior remain stable; Node and Chrome tests cover routes on both floors and wrong-floor cases.
- The original Hallway and Physics Playground remain intact as development scenes.

**Constraints:** Prototype only two usable floors, a limited number of rooms, and simple solid geometry. No third floor, fully furnished rooms, new physics framework, multi-class progression, or final art pass. Ask the product owner to approve the two-floor layout before implementing it. Follow AGENTS.md; do not commit or push automatically.

### 11. First complete playable class-navigation challenge

**Status:** Completed

**Complexity:** Medium

**Objective:** Validate the complete gameplay loop across a small two-floor school: read the schedule, infer a floor and room location, navigate, and arrive before the deadline or lose.

**Contribution to the vision:** Produce a compact but complete, genuinely three-dimensional LateForClass challenge.

**Scope:** Combine the existing schedule, simulated clock, automatic arrival, multiple numbered classrooms, approved room-number logic, and two-floor prototype in one coherent attempt. Make the start location and allotted time suitable for more than one possible classroom destination. Preserve clear win/loss feedback and restart.

**Dependencies:** Milestones 7–10.5, plus approval of remaining design decisions such as starting position and which destination(s) the prototype should exercise.

**Approved challenge:** The player starts at the existing ground-floor spawn. Mathematics starts at 09:00 in First-floor Room 102, giving the player 60 active seconds from 08:00 at the configured 60× rate. Room 002 exercises the alternate route by changing `schedule.roomId` in a test run.

**Acceptance criteria:** End-to-end browser runs demonstrate an on-time arrival on another floor, a timeout loss, and entry into an incorrect room; restart restores time, doors, and player state. The player can infer a route from the schedule and in-world signs alone, without a developer marker or advance knowledge. Test routes include both stairs and at least two possible destination rooms.

### 11.5. Reusable environmental objects and furniture

**Status:** Completed

**Complexity:** Medium–Large

**Objective:** Introduce a reusable, data-driven system for placing furniture and environmental objects throughout the school without hardcoding individual objects in `Level.js`.

**Contribution to the vision:** Transform empty rooms and corridors into recognizable school spaces while establishing a scalable foundation for future visual detail.

**Scope:**

- Introduce a small catalog of reusable environmental objects, initially including:
  - Student desk
  - Student chair
  - Teacher's desk
  - Whiteboard
  - Locker
  - Bench
- Define object placement, orientation, and optional configuration in level JSON.
- Create a dedicated `EnvironmentObjectFactory` or equivalent module to construct objects from these definitions.
- Initially construct objects using simple Three.js geometry and materials.
- Separate an object's logical identity and placement from its visual representation.
- Support collision geometry for objects that physically obstruct the player, such as desks, chairs, lockers, and benches.
- Reuse existing collision mechanisms where practical rather than introducing a separate physics system.
- Allow decorative objects to be non-collidable.
- Make it possible to replace procedural objects with imported 3D models in a future milestone without changing level placement data.
- Ensure objects are correctly disposed of when rebuilding or restarting levels.
- Extend the existing debug view to display collision geometry for collidable furniture.

**Architecture:**

- `Level` owns the placement and lifecycle of environmental objects.
- A dedicated factory owns the construction of reusable object types.
- Existing spatial and collision systems remain authoritative.
- Object placement is defined in level JSON.
- Do not add object-specific construction methods for every furniture type to `Level.js`.
- Keep geometry and materials reusable where possible.

**Dependencies:** Milestones 9.5, 10.5, and 11.

**Acceptance criteria:**

- All six initial environmental object types can be instantiated from level JSON.
- Multiple instances of an object type can be placed with different positions and rotations.
- Changing an object's location in JSON moves it without code changes.
- The player cannot walk through furniture designated as solid.
- Decorative objects do not block movement.
- Furniture collision boundaries match the objects' physical geometry sufficiently for reliable navigation.
- Objects appear correctly in solid rendering mode.
- Debug view displays the collision volumes of solid objects.
- Restarting or rebuilding a level does not duplicate objects or leak resources.
- Existing doors, stairs, movement, room detection, timing, and win/loss behavior remain unchanged.
- Automated and browser tests verify object placement, collision, resource cleanup, and regression behavior.

**Constraints:**

- Use simple placeholder geometry; do not establish the final artistic style.
- Do not introduce a complete asset-management framework.
- Do not add complex furniture interactions or movable objects.
- Do not add new gameplay mechanics.
- Preserve the existing vanilla JavaScript and Three.js architecture.
- Follow AGENTS.md and update CHANGELOG.md.
- Do not commit or push automatically.

**Implementation note:** Start with a small number of objects in one classroom and one corridor. Validate placement, collision, rendering, and cleanup before expanding the catalog.

### 11.6. Lighting and shadow foundation

**Status:** Completed

**Complexity:** Medium

**Objective:** Establish a reusable, configurable lighting and shadow system for school interiors, including corridors, classrooms, and stairwells.

**Contribution to the vision:** Create depth, atmosphere, and spatial readability through lighting, making the school feel like a recognizable environment rather than a collection of uniformly illuminated geometric objects.

**Scope:**

- Introduce a dedicated `LightingManager` or equivalent module responsible for configuring and managing level lighting.
- Support ambient or hemispheric illumination as well as directional, point, and spot lights where appropriate.
- Define lighting configuration in level JSON rather than hardcoding individual lights in `Game.js`.
- Add reusable ceiling-light fixtures suitable for classrooms and corridors.
- Distinguish between visible light fixtures and actual Three.js light sources.
- Enable Three.js shadow mapping and configure an appropriate soft-shadow technique.
- Allow selected objects, including furniture, walls, doors, and floors, to cast and/or receive shadows.
- Support simulated daylight entering through openings or windows where suitable geometry exists.
- Use lighting to improve the visibility of stairs, doors, room identifiers, and navigational cues.
- Introduce lighting configurations that can be reused in multiple rooms.
- Avoid excessive numbers of dynamic shadow-casting lights.
- Ensure lighting resources are managed correctly when levels change or restart.
- Preserve the existing solid-rendering and collision-debug modes.

**Architecture:**

- `LightingManager` owns the creation, configuration, and lifecycle of lights.
- `Level` supplies level-specific lighting definitions.
- `Game` coordinates lighting initialization without implementing individual lighting effects.
- Environmental objects expose appropriate render and shadow properties.
- Lighting must not affect collision geometry or gameplay logic.

**Dependencies:** Milestones 4.5, 9.5, 10.5, and 11.5.

**Acceptance criteria:**

- Lighting settings can be changed through level JSON.
- One classroom and one corridor demonstrate configurable indoor lighting.
- At least one light source produces visible shadows from appropriate objects.
- Floors, walls, doors, and furniture receive or cast shadows where configured.
- Light fixtures can appear illuminated without requiring every fixture to cast shadows.
- Indoor areas remain readable and do not become excessively dark or washed out.
- Room signage remains legible under the new lighting.
- Shadows move correctly with an interactive door where applicable.
- Debug visualization remains usable.
- Lighting does not modify collision or arrival behavior.
- Performance is evaluated in the browser, including the cost of shadow mapping.
- Existing automated tests and Chrome regression tests continue to pass.

**Constraints:**

- Use built-in Three.js lighting and shadow capabilities.
- Do not introduce an external rendering engine.
- Do not implement global illumination, ray tracing, or advanced post-processing as part of this milestone.
- Do not add one shadow-casting light for every fixture.
- Do not establish a final lighting style or color palette without product-owner approval.
- Avoid unnecessary abstractions and maintain the existing no-build development setup.
- Follow AGENTS.md and update CHANGELOG.md.
- Do not commit or push automatically.

**Implementation note:** Begin with a limited lighting experiment in one classroom and corridor. Prefer a small number of carefully configured light sources and shadows over many expensive dynamic lights.

**Verification:** The Chrome comparison used a 1000×600 render target and a GPU readback. Median per-render time across 24-frame batches was 0.63 ms with shadows off and 0.77 ms with shadows on. The measurement covers this scene and test machine. A door-only pixel comparison showed visible shadows at both door angles and a different shadow footprint after opening.

### 11.7. Furnished classroom and environmental prototype

**Status:** Completed

**Complexity:** Medium

**Objective:** Combine the reusable furniture and lighting systems into one convincing, fully navigable classroom and its surrounding corridor.

**Contribution to the vision:** Demonstrate how architecture, furniture, lighting, signage, and navigation can form a coherent and recognizable school environment before applying the approach throughout the building.

**Scope:**

- Select one existing classroom as the demonstration environment.
- Furnish it using the reusable object catalog developed in milestone 11.5.
- Include an arrangement of student desks and chairs, a teacher's desk, and a whiteboard.
- Add appropriate corridor details, such as lockers, benches, or noticeboards.
- Apply the lighting system from milestone 11.6 to the classroom and adjoining corridor.
- Evaluate simple classroom and corridor materials, colors, and surface treatments without committing to a final art direction.
- Ensure furniture placement leaves believable walking routes through the classroom.
- Maintain clear access through the door and into the classroom arrival region.
- Preserve room signage, wayfinding clues, and floor-numbering conventions.
- Evaluate furniture scale and density relative to the first-person camera and player dimensions.
- Ensure furniture, room layout, and lighting remain configurable through level data.
- Compare the environment in solid and debug rendering modes.
- Document what works visually and technically, and identify improvements for the subsequent art-direction milestone.

**Dependencies:** Milestones 11, 11.5, and 11.6.

**Acceptance criteria:**

- One classroom contains a believable arrangement of desks, chairs, teaching furniture, and a whiteboard.
- An adjoining corridor includes at least two types of environmental detail.
- Furniture is correctly positioned and scaled relative to the player and room geometry.
- The player can move naturally around desks, chairs, and other obstacles.
- The correct classroom can still be entered and the arrival objective completes automatically.
- Lighting and shadows visibly improve depth and readability.
- Door interaction, collision, jumping, stairs, timing, and win/loss conditions remain functional.
- Classroom and corridor objects are defined through reusable systems rather than hardcoded scene-specific geometry.
- Debug view remains usable for collision inspection.
- A browser walkthrough demonstrates the furnished classroom in gameplay.
- Performance and resource cleanup are verified.
- All existing automated and browser regression tests continue to pass.
- The prototype documents visual observations, technical limitations, and recommendations for broader environmental development.

**Constraints:**

- Prototype only one furnished classroom and its immediate corridor.
- Do not furnish the entire school.
- Do not introduce character models, animations, object interactions, or new gameplay mechanics.
- Do not select a final artistic style without product-owner approval.
- Preserve the existing school layout and room-numbering system unless a specific change is separately approved.
- Follow AGENTS.md and update CHANGELOG.md.
- Do not commit or push automatically.

**Implementation note:** This milestone should demonstrate the quality and practicality of the reusable environmental systems. Once validated, furnishing additional rooms should primarily involve level-data changes rather than new application code.

**Verification and prototype findings**

- Room 003 contains eight desk-and-chair pairs in two rows, a teacher's desk and whiteboard at the teaching end, and a 2.35-unit central aisle. The cross aisle is about 0.8 units wide for a player 0.6 units across. Three lockers and a bench flank the origin end of the corridor, clear of the doorway and stair branch.
- At standing camera height in Chrome, the aisle leads the eye toward the whiteboard. Warm desk tops and floor stand out against the cool classroom walls, and shadows separate furniture legs from the floor. The corridor sign remains readable above the furniture. Debug view exposes the same collision bounds, with distant stair and wall outlines adding visual clutter.
- All 90 Node and 67 Chrome regression tests passed. The Chrome walkthrough crossed the aisles, jumped in the corridor, visited Room 003 on the default run before winning in Room 102, and won on entry to Room 003 when it was the scheduled room. Restart disposed of shared furniture resources and the shadow map and restored the scene and closed doors.
- At 1000×600 in Chrome on the test machine, median per-render time with GPU readback across 24-frame batches was 1.10 ms with shadows off and 1.41 ms with shadows on. This measures one classroom view. The prototype uses basic shapes and flat materials. For broader use, retain clear floor and sign contrast, test spacing from a first-time player's viewpoint, and measure rendering cost as more rooms are furnished.

### 13. Art direction and visual design prototype

**Status:** Completed

**Complexity:** Medium

**Objective:** Explore a coherent visual identity for the school while maintaining navigational clarity.

**Contribution to the vision:** Make the functional two-floor environment recognizable and engaging rather than purely a technical blockout.

**Scope:** Apply the approved stylized school palette to the route from Room 003 to Room 102. Use warm off-white walls and matte surfaces throughout, with teal accents on the ground floor and ochre accents on the first floor. Use plain-text floor names and classroom numbers alongside the colors.

**Dependencies:** Milestones 4.5, 11, 11.5, 11.6, and 11.7. The prototype can proceed while milestone 12 is deferred. Future playtest findings should inform refinements to navigational readability and visual priorities. Product-owner approval of the proposed artistic direction is required.

**Acceptance criteria:** A playable sample includes both floors, a stair route, doors and legible room labels; normal/debug view and all gameplay still work. Evaluate readability, performance, implementation effort, and whether the visuals reinforce floor and room-number understanding.

**Verification and prototype findings**

- Corridor flooring, doors, and plaques carry the floor accents. A sign about stairs uses the destination floor's color and names it in text. Two local lights brighten the stairs and upstairs corridor. Room 102 has a whiteboard using the existing decorative furniture type.
- From standing height in Chrome, the origin and first-floor landing signs were readable at about 4 and 2.8 level units respectively. Room 003 and Room 102 labels were readable on approach, and the stair treads and risers were visible from below. The walkthrough visited Room 003, climbed the stairs, switched to collision view and back, and reached the scheduled Room 102 on time.
- All 90 Node and 67 Chrome regressions passed. A data comparison verified identical collision geometry, room IDs and bounds, and schedule and time settings.
- At 1000×600 in Chrome, with GPU readback and both scenes reset, median render time went from 0.68 to 0.89 ms in the ground corridor, 0.49 to 0.50 ms on the stairs and 0.45 to 0.45 ms upstairs. These measurements cover three fixed views on the test machine.
- The prototype uses the existing materials, geometry, sign rendering and lighting systems. The code changes are limited to optional solid door and sign background colors. Room 102 still uses sparse furnishings. The style's effect on first-time navigation remains a playtesting question.

### 14. Classroom furniture model trial

**Status:** Completed

**Objective:** Try the imported desk and chair models in two placements each in Room 003 to see how the models fit the approved prototype style.

**Scope:** Compare the repository's desk and chair models with the procedural versions at first-person scale. Use the existing placements and verify the visible footprints against the collision outlines.

**Dependencies:** Milestones 11.5, 11.7, and 13.

**Acceptance criteria:** Both pairs fit the room's scale and floor, preserves aisle clearance, and renders and cleans up correctly on restart. Document the performance and an in-game comparison for product-owner review.

**Verification**

- Room 003 uses the GLBs for the two outer desk-and-chair pairs in the row nearest the door. The procedural furniture in the other positions provides a direct comparison. Each GLB keeps its authored scale and materials. The imported desk is narrower than the procedural desk, and the four placements leave the classroom aisles clear.
- All 92 Node and 68 Chrome tests passed. Chrome verified one request per asset, V collision outlines, shared resources after restart, automatic arrival with Room 003 scheduled, and a win via the public stairs with Room 102 scheduled.
- At 1000×600 in Chrome with GPU readback, median render time rose from 0.66 to 0.84 ms in the classroom view and from 0.55 to 0.64 ms in the closer view of one pair. This measures two fixed views on the test machine. Each imported item uses one enclosing collider, including the space between its legs.

### 15. Furnish the destination classroom

**Status:** Completed

**Objective:** Make Room 102 immediately recognizable as a classroom when the player arrives.

**Scope:** Use the existing furniture and lighting systems to add two student desk-and-chair pairs, a teacher’s desk, a standing chalkboard, and wooden shelves with books. Preserve the entrance and arrival region.

**Dependencies:** Milestones 11.7, 13, and 14.

**Acceptance criteria:** The default route still wins on entry. The furniture placement leaves the doorway and aisles clear, with verified debug outlines and measured render cost.

**Verification**

- Corrected the imported chair’s 180° facing change in Room 003. Room 102’s two pairs face the teaching area. The solid furniture uses one collision box per item. The seven books are decorative and fit between the shelf dividers.
- All 93 Node and 69 Chrome tests passed. The Chrome walkthrough verified doorway and aisle clearance, valid arrival on the default timed route, the V collision view, and asset reuse on restart.
- The six game GLBs total 13.0 MiB, down from 345.6 MiB for the corresponding source files. With the browser cache disabled on localhost, the game was ready about 0.27–0.66 seconds into the two walkthroughs. At 1000×600 with GPU readback on the test machine, median render time was 0.57–0.89 ms at the entrance and 0.52–0.53 ms facing the shelves, from about 0.40 ms in both views before furnishing. Startup measurements cover a local server.

### 16. Historic-school visual direction and reference benchmark

**Status:** Completed

**Complexity:** Small–Medium

**Objective:** Establish an approved visual reference and realistic performance budget for an old-English-university-inspired LateForClass environment.

**Scope:** Assemble a concise visual style guide for one corridor, one classroom, a stairwell, a window, and an exterior courtyard view. Specify architectural proportions, historic stone and timber, door and arch styles, floor materials, age and wear, lighting moods, and signage. Select a small number of consistent reference images and evaluate available GLB assets and their licenses. Define a representative browser target and measurable frame-time, download-size, and memory budgets. Keep the earlier teal/ochre prototype available as a baseline rather than treating it as the final style.

**Dependencies:** Milestones 11.6, 13–15; product-owner approval of reference direction.

**Acceptance criteria:** The product owner approves a visual reference sheet, an initial reusable asset shortlist, a representative test scene, and measurable browser performance targets. The milestone documents an asset licensing/attribution register. No gameplay, geometry, or engine changes are required.

**Constraints:** No full school redesign or bulk asset import. No commitment to photorealism. Follow AGENTS.md; no automatic commits or pushes.

**Verification:** The product owner approved the [reference sheet and benchmark](docs/historic-school-reference.md), including the initial asset shortlist, the representative route, and the browser budgets. The reference sheet records asset provenance and measurements from desktop Chrome at 1080p. All 93 Node and 69 Chrome tests passed during the Room 101 baseline verification.

### 17. Asset catalog, reproducible model pipeline, and historic architectural kit

**Status:** Completed

**Complexity:** Medium–Large

**Objective:** Extend the existing GLB asset integration into a scalable, reproducible system for building a large, visually coherent historic school, without rebuilding the furniture factory or duplicating completed optimization work.

**Contribution to the vision:** Make it practical to furnish and construct many distinctive rooms and corridors using consistent, performant assets while retaining the ability to replace models and adjust the school's appearance without rewriting level placements.

**Existing foundation (do not reimplement):**

- `EnvironmentObjectFactory` already supports procedural furniture and imported GLBs, with shared loading, instances, fitted collision boxes, and debug visualization.
- Milestone 15 completed the Room 102 furniture integration (student desks/chairs, teacher's desk, standing chalkboard, wooden shelves and books), corrected the imported student's chair 180° facing change, and verified the timed route and resource reuse.
- The six optimized game GLBs used for that milestone total **13.0 MiB**, compared with **345.6 MiB** for their corresponding originals. This is a recorded prototype result, not proof that a complete asset pipeline or catalog exists.
- Existing lighting, shadows, materials, and scene lifecycle should be audited and reused.

**Scope:**

1. **Audit before editing.** Inspect the current factory, actual level placements, optimized GLBs, model-loading paths, disposal behavior, conversion tooling, and material handling. Document what is already working, what is manual, and the smallest gaps that must be closed. Do not mark Codex's work as unfinished without evidence.
2. **Reproducible asset pipeline.** Define a source-original versus game-ready asset layout; retain originals unmodified; document or script the repeatable conversion/optimization steps, including texture resolution, compression choices supported by the current Three.js version, coordinate orientation, scale, origin, naming, and quality checks. Avoid requiring Blender at game runtime.
3. **Logical model catalog.** Map meaningful object types (for example `studentChair`, `teacherDesk`, `standingChalkboard`, `woodenDisplayShelf`) to default optimized GLBs and optional asset-specific scale, rotation offset, material options, and collider definitions. Allow explicit overrides, and keep procedural versions available when useful. Existing level placements must remain compatible or be migrated narrowly and demonstrably safely.
4. **Focused factory integration.** Reuse `EnvironmentObjectFactory` and shared asset loading. Resolve logical object types through the catalog instead of repeating model paths across many level placements. Preserve safe resource sharing, cloning, collision bounds, restart behavior, and the `V` debug view. Extend collision configuration only where simple enclosing boxes materially interfere with navigation; do not introduce a new physics engine.
5. **Small historic architectural kit.** Curate or create a consistent, license-checked starter set of modular stone wall/arch pieces, timber doors and frames, window frames/sills, columns, trim, floors, and stairs or railings. Establish compatible dimensions and placement conventions. Prefer suitable downloaded assets; do not bulk-import models merely because they are available.
6. **Performance and visual validation.** Demonstrate the catalog and kit in a compact playable test scene using repeated instances. Report optimized download sizes, texture dimensions, loading times, frame times, and memory usage where browser measurements are reliable. Keep the reference visuals from milestone 16 in view.

**Dependencies:** Milestones 14–16; existing `EnvironmentObjectFactory`, imported-model support, lighting and debug systems.

**Acceptance criteria:**

- The audit explicitly distinguishes pre-existing functionality from additions made under this milestone.
- Source originals and game-ready assets have an intentional, documented organization, and at least one existing model can be rebuilt into its game-ready GLB reproducibly.
- At least four existing furniture/prop types are mapped through the logical catalog; model replacement can be performed by editing the catalog without changing each placement.
- The corrected student chair faces the right direction wherever its logical type is used, without changing procedural chair orientation or requiring per-instance 180° fixes.
- At least one reusable stone architectural component, one historic door/frame component, and one window-related component can be placed at consistent scale from level data.
- Repeated assets share loadable resources where appropriate; restart does not duplicate meshes or leak shared resources.
- Navigation, model/collision alignment, debug outlines, opening doors, scheduled room arrival, stairs, timeouts, and existing Node and Chrome regression tests remain correct.
- The representative browser scene includes screenshots and measured loading/render performance, with asset licenses recorded.

**Constraints:**

- Preserve vanilla JavaScript, the current factory, current Three.js version, and the existing no-build workflow unless a separately approved change requires otherwise.
- A Three.js upgrade, complex collision system, complete school rebuild, and bulk asset import are **out of scope**.
- Do not redo milestone 15's model optimization, furniture placement, or chair fix; investigate them only to establish reusable conventions.

**Implementation note:** Begin with an audit and a small catalog prototype using the models already in the repository. Add architectural assets only after verifying the reuse and conversion workflow. The intended result is a thin extension of proven systems, not a new asset-management framework for its own sake.

**Starter-kit verification:** The [historic asset kit](docs/historic-asset-kit.md) records the audit, catalog and door conventions, source and runtime build commands, and screenshots. The conversion script rebuilt the student chair byte-for-byte. All six classroom GLBs now resolve through the catalog. Six original architecture GLBs demonstrate repeated limestone arches, moving oak doors with frames, and a wall-backed window sample. All 95 Node and 71 Chrome tests passed. Three Chrome runs at 1080p met the approved startup, frame interval, download, and estimated memory ceilings.

**Revised architectural acceptance criteria**

- A single representative area reads as an old English university with no furniture or decorative props. Show substantial masonry, worn historic flooring, a high vaulted ceiling, and arches formed by the architecture.
- Ceiling, wall, arch, and floor components are reusable through level data. Preserve the existing model catalog, optimized GLBs, orientation corrections, resource reuse, and collision system.
- Show first-person views of the entrance and vault and compare them with the approved references. Keep the timed route, controls, stairs, doors, and room identities usable. The sample stays within the approved browser budgets.

**Wall and door mounting**

Keep usable wall faces near entrances and route decisions, retain the existing navigation signs, and preserve the moving door panel as the attachment point for future door-mounted objects. The [kit’s mounting conventions](docs/historic-asset-kit.md#wall-and-door-mounting) record how level data, room IDs, and shared frame models can support this work in milestone 18, subject to approval.

**Revised implementation and verification:** The [vaulted hall sample](docs/historic-asset-kit.md#revised-architectural-sample) demonstrates two adjoining 5-unit bays with a 6.5-unit crown, 0.8-unit masonry walls, and recessed entrances. All 95 Node and 71 Chrome tests passed. The Room 101 route met the four browser limits in three 1080p runs.

**Implemented refinement · Arched masonry doorways and fitted oak leaves**

Convert the three upstairs classroom entrances within the vaulted hall using a shared pointed profile. Keep the 1.8-unit clear width and the existing 2.25-unit height at the spring line, then shape the arch above it. Use the hall's textured masonry, deep reveals, and dark oak. Generate the opening through the thickness of the wall and shape the oak leaf from the same profile. Use catalog entries and level data for both parts. Reuse the door's existing hinge, interaction range, and room-arrival logic. Retain rectangular door support for other placements.

**Additional acceptance criteria for milestone 17**

- A repeated pointed opening is built through the masonry in both a side entrance and the end entrance. The matching oak leaf closes with an even seam and no visible gaps through the assembly or overlaps with the reveal. Show the closed fit from each side and the opened leaf in first-person views.
- **E** opens the arched leaf using the existing hinge and swing. The closed leaf still blocks passage, and after opening the lower doorway retains the previous width and head clearance. The visual opening, collision, and **V** outlines stay aligned through both door states.
- Both arched and rectangular doors work in the same level. Test traversal, restart and model reuse, entry into furnished Room 102 as a wrong room, and automatic arrival in scheduled Room 101. Run the Node and Chrome regressions and check the approved browser budgets.

**Doorway verification:** The [first-person arched-door views](docs/historic-asset-kit.md#arched-classroom-doorways) show the fitted leaf from both sides and the open poses. All 96 Node and 72 Chrome tests passed. Three timed runs met the browser budgets.

**Completion:** The product owner accepted milestone 17 on 2026-11-24. The final furniture check passed all 97 Node and 73 Chrome tests, including hallway clearance and the fitted chair collision outline. The furnished sample measured 15.96 MiB at startup against a 16 MiB budget. See the [changelog](CHANGELOG.md#2026-11-24--complete-milestone-17).

### 18. Historic corridor and classroom visual-quality slice

**Status:** Completed

**Complexity:** Large

**Objective:** Turn one representative classroom, corridor and stair approach into a convincing historic school scene at first-person scale.

**Scope:** Apply the architectural kit to one compact playable route. Incorporate old stone walls, convincing doors and framing, historic flooring, ceiling details, trim, appropriate furniture and legible signs; use physically based materials where supported. Compare in-game screenshots with the approved references and iterate on proportions, lighting and material richness. Keep the room and route fully playable.

**Dependencies:** Milestones 16–17, and existing classroom/lighting systems.

**Acceptance criteria:** An approved first-person screenshot comparison demonstrates the intended old-college atmosphere. The player can navigate, open the door, reach the scheduled room and use debug view without mismatched collisions. Record frame time, scene asset size and visual trade-offs on the target browser.

**Constraints:** One visual-quality slice only. No new wings, gameplay features or final school-wide replacement.

**Implementation and visual review:** The sample runs from the public stairs through the vaulted hall to Room 101. It adds pale stair treads, warm lanterns, timber trim, an oak classroom floor, and brass room plaques generated from classroom IDs. The corridor iteration adds lime plaster, low oak paneling, a worn oak floor, a portrait, and a noticeboard within the existing bays. Room 101 uses the student-chair model, and the Room 102 objective lets players explore Room 101 along the way. [Collegiate corridor comparison](docs/historic-slice.md#collegiate-corridor-review)

**Completion:** The product owner accepted the visual slice on 2026-11-24. The final seating check passed all 99 Node and 75 Chrome tests and verified a timed run through Room 101 to Room 102. The corridor benchmark met all four browser budgets. [Verification record](CHANGELOG.md#2026-11-24--complete-milestone-18)

### 19. Windows, daylight, and visible exterior courtyard

**Status:** Completed

**Complexity:** Medium–Large

**Objective:** Create convincing windows looking onto an outdoor setting, including daylight and shadows, without sacrificing indoor performance.

**Scope:** Build actual window openings and frames in selected walls, appropriate glass/transparency where useful, and a compact courtyard with adjacent old-school facades, sky and landscape visible through the windows. Reuse the current lighting system; establish different daylight and dim-interior moods. Keep the outdoor vista initially non-traversable; ensure the walls and window openings have correct collision. Use a modest number of shadow-casting lights and minimize expensive transparent materials.

**Dependencies:** Milestones 17–18 and existing lighting/shadow foundation.

**Acceptance criteria:** From one corridor and one classroom, a player can clearly see a coherent courtyard beyond windows. Daylight and interior light read naturally; nearby entrances, windows and walls have correct collision; the route, signage and deadline remain usable. Browser performance and visual evidence are recorded; regression tests pass.

**Constraints:** No explorable football pitch or entire campus yet. This is an indoor/outdoor rendering proof, not a full exterior level.

**Verification:** The corridor near Room 103 and Room 101 look onto the same quadrangle. Chrome verified the sightlines and interior daylight. The glazing blocks jumps through both openings and appears in V. All 100 Node and 76 Chrome tests passed. Three timed Room 102 runs met the four browser budgets. [First-person views and measurements](docs/courtyard-window-review.md)

### 19.5. Architecture preparation for a connected, expandable school

**Status:** Completed. The product owner approved the ownership and migration design and physical adjacency as the foundation for milestone 20.

**Verification:** All 108 Node and 83 Chrome regressions passed. Two test areas share a GLB across concurrent loads and independent unload/reload cycles. Three timed school walkthroughs met the original four budgets. Startup grew by 14,564 bytes, leaving 8,616 bytes of headroom. [Architecture decision, screenshots and measurements](docs/connected-school-architecture.md#verification)

**Complexity:** Large

**Objective:** Refactor the existing single-level architecture into clearly owned, testable components that can support multiple independently loaded areas of one persistent school, without changing the current game's appearance, layout, controls or gameplay.

**Contribution to the vision:** Prepare LateForClass for an enormous, gradually discoverable school containing academic buildings, service passages, courtyards and eventually architecturally impossible areas. Establish the technical foundations for loading and unloading areas without resetting the player's timetable, losing progress, duplicating assets or disrupting navigation.

**Rationale:**

The existing architecture has served the small two-floor prototype well. `GameSession`, `GameUI`, `Player`, `EnvironmentObjectFactory` and `LightingManager` already provide useful separation of responsibilities.

However, the current design assumes that a `Level` represents one complete playable environment. `Level` coordinates geometry, imported assets, furniture, doors, collision, signage, room detection and cleanup. Model and lighting resources are largely managed around the lifetime of that complete environment.

Milestone 20 will introduce a school composed of multiple connected areas, only some of which may be loaded simultaneously. The current ownership and lifecycle assumptions must be reviewed and adjusted before that expansion.

This milestone is a **focused, behavior-preserving architectural refactor**, not a new game feature or a general-purpose engine redesign.

#### 1. Architecture audit and proposed design

Before implementation, inspect the actual current source and document:

- The responsibilities and dependencies of `Game`, `Level`, `Player`, `GameSession`, `EnvironmentObjectFactory`, `LightingManager`, and related rendering/collision components.
- How level data becomes scene geometry, collisions, doors, signs, furniture, lights and room-arrival regions.
- Which components currently own shared models, geometry, materials, textures and GPU resources.
- What happens during initialization, retry, level rebuilding and disposal.
- Which assumptions depend on all geometry belonging to one simultaneously loaded level.
- Any existing architecture that can be reused without modification.

Produce a concise proposed ownership model, component diagram and lifecycle sequence.

Explicitly identify which existing classes should remain unchanged, which responsibilities require extraction, and which changes can wait until milestone 20.

**Approval gate:** Present the proposed component boundaries, ownership rules, migration approach and anticipated risks to the product owner before implementing the refactor.

#### 2. Separate school, area and session responsibilities

Establish conceptual separation between:

**School / World**
- Represents the connected school as a whole.
- Owns or references the registry of area identities and their relationships.
- Coordinates which areas are loaded and active.
- Provides a future integration point for transitions and global room lookup.
- Does not own the player's school clock or win/loss rules.

**Area**
- Represents one independently manageable portion of the school, such as a corridor, group of rooms, stairwell or courtyard.
- Owns its local scene objects, collision objects, doors, signs, room regions and local lighting registrations.
- Can be constructed and disposed of without rebuilding unrelated areas.
- Exposes the local spatial queries needed for movement and interaction.

**Game**
- Remains the application coordinator.
- Coordinates the renderer, player, world and game session.
- Does not directly construct individual architectural elements or implement asset-loading policies.

**GameSession**
- Continues to own the school clock, schedule, run phase and win/loss rules.
- Must remain independent of which areas are currently loaded.
- Must not be reset simply because the player enters another area.

**Player**
- Continues to own movement, camera orientation, gravity and jumping.
- Uses a stable spatial-query interface rather than depending on the concrete implementation of one `Level`.

Retain `Level` where it remains useful. Refactor or repurpose it only where necessary to establish these boundaries. Do not introduce new classes solely to match the terminology above.

Avoid duplicating functionality between `World`, `Level` and `Area`.

#### 3. Define area identity and spatial contracts

Establish the minimum data and interfaces required for future connected areas.

Each area must have:

- A stable, unique identifier.
- A defined coordinate convention and relationship to the school/world coordinate system.
- A self-contained definition of its local geometry and spatial regions.
- A predictable construction and disposal lifecycle.
- A way to identify its rooms, doors and collision objects.
- A defined interface through which the world can query or manage it.

Define how area identifiers, room identifiers and object identifiers remain stable independently of whether the relevant area is currently loaded.

Preserve the existing room-numbering convention and all current room identities.

Define the coordinate strategy explicitly. Milestone 20 should be able to connect physically adjacent areas without accumulating arbitrary coordinate offsets or duplicating boundary geometry.

Do not implement impossible spatial transitions in this milestone. The future design must not unnecessarily rule them out.

#### 4. Establish explicit asset ownership

Review the current `EnvironmentObjectFactory`, GLB loading and optimized asset pipeline.

Introduce or consolidate a shared resource owner with responsibilities for:

- Loading models and reusable resources.
- Caching assets by stable identity.
- Avoiding duplicate concurrent requests for the same asset.
- Reusing shared geometry, materials and textures across areas.
- Keeping shared resources alive while they remain in use.
- Releasing resources according to an explicit disposal policy.
- Handling loading failures without leaving partially initialized or unusable areas.

Distinguish between:

**Shared resources:** Model templates, geometry, textures and materials that may be referenced by several areas.

**Area-owned instances:** Scene objects, transforms, collision volumes, debug meshes and other instance-specific objects that should disappear when an area unloads.

Ensure unloading one area cannot invalidate resources used by another.

Choose a simple, explicit cache-lifetime policy appropriate for the current project. Reference counting is optional, not mandatory. If the implementation retains shared assets for the lifetime of the game, document that decision and its memory implications.

Preserve the existing optimized GLB pipeline, asset catalog, model corrections and procedural fallback capabilities.

Avoid rebuilding a functioning asset system.

#### 5. Define area lifecycle and state restoration

Establish a consistent lifecycle contract, distinguishing:

- **Unloaded:** No active area-specific scene resources.
- **Loading:** Required resources and area objects are being prepared.
- **Loaded:** The area is constructed and available.
- **Active:** The area participates in the relevant rendering, collision, interaction and/or update operations.

Active must not necessarily mean that only one area can be active. Adjacent areas may need to coexist for visible doorways and seamless movement.

Define how loading failures, duplicate load requests and repeated unload requests are handled.

Separate **persistent logical state** from **temporary rendered state**.

For example:

- Whether a door is open is logical state.
- The door's mesh and debug collider are area-owned runtime objects.
- The current school time belongs to `GameSession`.
- The player's position belongs to `Player`.
- A room's identity does not depend on whether its geometry is loaded.

Define how an area restores relevant logical state after reloading.

For milestone 19.5, an in-memory state representation is sufficient. Browser storage, long-term saves, multi-day progression and discovery history belong to later milestones.

Preserve the existing retry semantics. Retrying the current challenge must restore the configured initial time, player location, doors and gameplay state.

#### 6. Prepare area-aware collision and spatial queries

Preserve the current movement and collision behavior while making the spatial-query boundary independent of one monolithic level.

The architecture must support future queries for:

- Horizontal movement obstruction.
- Floor and platform heights.
- Vertical collisions.
- Stair and step traversal.
- Door interaction candidates.
- Current room and arrival-region identification.

Define which component receives those queries and how it delegates them to loaded areas.

Allow relevant adjacent-area geometry to participate when the player approaches or crosses an area boundary.

Avoid gaps, duplicate colliders or inconsistent collision behavior at shared boundaries.

Do not introduce a new physics engine, broad-phase spatial index, octree or other acceleration system without evidence that it is necessary.

Preserve the existing movement physics, player dimensions and collision-debug view.

#### 7. Prepare lighting and rendering for multiple areas

Review `LightingManager` and its current resource lifetime.

Define how an area can register and release local lighting definitions and visible fixtures independently of other areas.

Preserve:

- Existing daylight and courtyard rendering.
- Historic interior lighting.
- Shadow configuration.
- Reusable fixture models.
- The collision-debug display.

Ensure releasing one area's lighting does not remove or invalidate lighting still required by another area.

Keep global illumination settings and area-specific lights clearly distinguished.

Do not implement a new lighting engine, dynamic weather, advanced global illumination or post-processing system.

Lighting transitions between areas may remain a milestone-20 concern.

#### 8. Preserve compatibility with existing levels

The current playable school, Hallway and Physics Playground must continue to work.

Choose and document a migration strategy:

- Preserve the current JSON schema through a compatibility adapter; or
- Introduce a minimally changed schema with a deterministic migration.

Do not manually redesign the existing school simply to accommodate the architecture.

Avoid duplicating level definitions or creating parallel systems that must be maintained indefinitely.

Maintain the existing vanilla JavaScript and browser-loading approach unless a clearly demonstrated technical limitation requires a separately approved change.

#### 9. Build a minimal architecture verification fixture

Create a small automated test fixture with two synthetic areas, **A and B**, that share at least one imported model.

The fixture is for architecture verification, not new playable content.

Demonstrate this lifecycle:

1. Load Area A.
2. Load Area B.
3. Verify that both can instantiate the shared model without duplicate asset loading.
4. Give each area distinct local objects and collision regions.
5. Unload Area A.
6. Verify that Area A's instances, colliders and local lights are removed.
7. Verify that Area B remains intact and its shared assets remain valid.
8. Reload Area A.
9. Verify that its objects are reconstructed once, with correct logical state and no duplication.
10. Repeat the cycle and verify predictable resource ownership and cleanup.

Include a separate compatibility walkthrough of the existing playable school.

A production-quality area-streaming system is explicitly outside scope.

#### 10. Tests and verification

Add focused automated tests for:

- Stable area and room identifiers.
- Area construction and disposal.
- Repeated and concurrent load requests.
- Asset loading and shared-resource reuse.
- Resource survival while referenced by another area.
- Safe cleanup and repeatable reloading.
- Local collision registration and removal.
- Logical state restoration after reloading.
- Area-local lighting registration and disposal.
- Error handling during incomplete asset loading.
- No reset of `GameSession` from area lifecycle events.
- Existing retry behavior.
- Existing room-arrival and scheduled-destination rules.

Where appropriate, verify resource identity and disposal calls directly rather than inferring correctness from screenshots.

Run all existing Node and Chrome regression tests.

Perform a browser walkthrough covering movement, camera control, doors, stairs, room arrival, lighting, courtyard visibility, the 60× clock, pause, timeout, retry and debug view.

Capture representative before-and-after screenshots to confirm that the refactor does not unintentionally alter the existing visual presentation.

Record relevant startup, loading, frame-time and memory measurements using the established milestone-19 performance methodology.

#### Dependencies

- Completed milestones 14–19.
- Existing `GameSession`, `Player`, `Level`, `EnvironmentObjectFactory` and `LightingManager`.
- Approved milestone-20 direction for connected, independently loaded areas.
- Product-owner approval of the specific ownership and migration design before implementation.

#### Acceptance criteria

**Architecture**

- [x] A documented ownership model clearly separates school-wide responsibilities, area-local responsibilities, game-session state and shared assets.
- [x] The proposed boundaries and migration approach have received product-owner approval.
- [x] Existing responsibilities are reused rather than duplicated.
- [x] No new central class becomes responsible for unrelated gameplay, rendering, assets and physics functionality.

**Area lifecycle**

- [x] Two independently managed synthetic areas can be loaded, unloaded and reloaded.
- [x] Area-specific objects, collision registrations and lighting resources have predictable lifetimes.
- [x] Repeated lifecycle operations do not produce duplicate instances, dangling registrations or invalid resource references.
- [x] Area logical state can be reconstructed independently of its render objects.

**Resource management**

- [x] Shared GLB resources are loaded and reused correctly.
- [x] Unloading one area does not invalidate resources still used by another.
- [x] Shared-resource ownership and disposal policies are documented and tested.
- [x] Existing model catalog and optimization functionality remain operational.

**Compatibility**

- [x] The existing two-floor school remains visually and functionally unchanged.
- [x] All existing rooms remain correctly numbered and reachable.
- [x] Doors, stairs, collision, jumping, camera, schedules and arrival detection behave as before.
- [x] The school clock and active objective are independent of area lifecycle operations.
- [x] Retry restores the expected initial state.
- [x] The Hallway and Physics Playground remain operational.

**Verification**

- [x] All existing Node and Chrome tests pass.
- [x] New lifecycle and resource-ownership tests pass.
- [x] Browser screenshots show no unintended visual regression.
- [x] Performance measurements show no material unexplained regression against the milestone-19 baseline.
- [x] A concise architecture decision record describes the selected design, rejected alternatives and known limitations.
- [x] `README.md`, `ROADMAP.md`, `CHANGELOG.md`, `AGENTS.md` and relevant test documentation reflect the implemented architecture.

#### Constraints

- This is a behavior-preserving architectural refactor.
- Do not add playable areas, classrooms, wings or new architectural content.
- Do not implement full area streaming, area traversal gameplay or background prefetching.
- Do not implement persistent school days, discovery history or route changes.
- Do not implement impossible connections or portals.
- Do not change the school's visual style.
- Do not introduce a new physics engine.
- Do not introduce a general-purpose entity-component system, dependency-injection framework or event bus.
- Do not upgrade Three.js without separate approval.
- Prefer composition and existing components over unnecessary abstractions.
- Avoid unrelated code cleanup or formatting changes.
- Follow `AGENTS.md`; do not commit or push automatically.

**Implementation sequence:**

1. Audit the current architecture.
2. Propose exact ownership boundaries, interfaces and migration strategy.
3. Obtain product-owner approval.
4. Implement the smallest necessary architectural changes.
5. Validate shared resources and area lifecycles with the synthetic fixture.
6. Verify the unchanged playable school and regression suite.
7. Document the resulting architecture and remaining limitations.

**Definition of done:** Milestone 20 can begin by connecting real playable areas using the established interfaces, without needing to redesign asset ownership, game-session state, collision delegation or area lifecycles.

## Current limitations

- The timed school uses six classrooms and one same-day deadline. The current default is Mathematics in Room 102, so Room 101 is available to explore during the run. First-time player comprehension and time allowance remain playtesting items.
- Furniture mixes procedural placeholders and imported models. Solid models use enclosing collision boxes.
- Much of the two-floor route still uses prototype finishes. The quadrangle is visible through two windows, and Room 102 still has the earlier wall-backed sample.
- The earlier pitch-snap bug has regression coverage; the previously reported intermittent sideways roll was not reproduced in the cited hallway investigation.
- The browser build requires WebGL and Pointer Lock. The repository serves its pinned Three.js build locally.

## Proposed milestones — priority order

### 20. Large-school area and connection architecture

**Status:** In Progress. The product owner approved the seven-room [First Court layout](docs/first-court-blockout.md). Area streaming is implemented and ready for product-owner review. The timed trial remains the default and the developer entry supports untimed inspection. [Streaming evidence and open benchmark gates](docs/milestone-20-new-school.md#8-streaming-stage-implementation-and-evidence)

**Complexity:** Large

**Objective:** Support the sensation of an overwhelmingly large school without loading and maintaining the entire world as one simultaneous scene.

**Scope:** Build First Court as a fourth school with a gatehouse and porter’s lodge, a covered cloister and an East Range classroom and stair lookout. The normal entry starts the Mathematics trial. Its public destination is Room 25. An explicit **developer-only** entry supports untimed inspection; it is not the default gameplay or a commitment to player-facing free roam. Early classes emphasize quick orientation and recoverable wrong turns; later milestones can add longer, clue-driven timed investigations. Prototype loading and releasing an adjacent area on demand, preserving cached reusable assets and required session state. Test seamless physical routes first; leave impossible or non-aligned transitions to a later milestone. Introduce measured visibility/culling strategies only as needed. Protect scheduled-room reachability and preserve clock behavior through transitions.

**Dependencies:** Milestones 17–19, current Game/Level/GameSession architecture.

**Acceptance criteria:** The default first-time experience creates an immediate, fair sense of urgency: a timed start, a legible but not prescriptive route choice, room plaques, a recoverable wrong turn, and intriguing optional spaces the player may wish to revisit. Test with at least one unfamiliar player in timed mode before showing them the map or explore mode. The player traverses at least three linked areas without losing clock, controls, room identity or objective. Returning to a previously visited area behaves consistently; streaming avoids duplicate resources and leaks; an unreachable-target validation test exists. Performance and loading behavior are reported for desktop browsers.

**Stage decision and remaining work:** Stage V1 is provisionally accepted. Stage V2's architectural repairs are ready for review. The startup budget remains open. Furnishing, exterior composition, unfamiliar-player validation and final milestone acceptance are separate review items. [Stage V2 evidence](docs/first-court-visual-spec.md#9-stage-v2-architectural-geometry-review)

**Constraints:** Do not populate the full campus or introduce non-Euclidean portals, persistent story progression or NPCs yet.

### 21. Beyond classrooms: service routes and playable exterior

**Status:** Proposed

**Complexity:** Large

**Objective:** Make the school feel like a functioning institution with discoverable, purpose-built routes beyond academic corridors.

**Scope:** Add a connected set of distinctive locations, chosen and approved individually from a maintenance room/passage, cafeteria kitchen, changing room/showers, courtyard, and football-field path. Start with one indoor service shortcut and one traversable exterior route; use the approved architectural assets and lighting styles. Give each route visual clues and navigational purpose rather than treating it as decoration. Preserve room numbering, scheduling and fair deadlines.

**Dependencies:** Milestones 18–20, plus approved route layout and individual environment choices.

**Acceptance criteria:** One challenge has at least two meaningful routes, including an optional service or outdoor passage. The player can infer and traverse them using in-world clues; doors, floors, exits, collision, lighting and level transitions function. The route is tested for fairness and browser performance.

**Constraints:** Do not construct every desired location at once; grow the world through separately reviewable pieces.

### 22. Persistent discovery and subtle school changes

**Status:** Proposed

**Complexity:** Large

**Objective:** Make learned knowledge valuable while occasionally changing familiar routes in intentional, surprising, fair ways.

**Scope:** Separate fixed area/connection definitions from active school state and the player's discovery history. Prototype one recognizable shortcut that is learned, later changes while the player is elsewhere or between classes, and presents a clue plus a viable alternative. Preserve change state across the relevant game sessions; specify exact persistence and reset behavior before coding. Verify changes cannot make a scheduled destination unreachable or produce unfair automatic timeout.

**Dependencies:** Milestones 20–21 and separately approved persistence/progression semantics.

**Acceptance criteria:** A scripted multi-visit scenario shows the same familiar area before and after one controlled change; the player can discover what happened and adapt without guessing randomly. Time, navigation, transitions and saved state remain consistent, with automated connectivity checks and browser walkthroughs.

**Constraints:** No random mid-run maze reshuffling; no seamless impossible portals yet.

### 23. Strange wings and impossible connections

**Status:** Proposed

**Complexity:** Large

**Objective:** Begin the gradual transition from a believable historic school to an internally understandable but architecturally absurd institution.

**Scope:** Design and seek approval for one unusual wing with a distinct, learnable rule. Prototype a doorway or staircase transition to an area whose spatial relationship cannot fit the ordinary world layout. Preserve continuity of player controls, scheduled objective, discoverability, loading and timing. Use the familiar school as an anchor and introduce the absurdity sparingly.

**Dependencies:** Milestones 20 and 22; approved unusual-wing design.

**Acceptance criteria:** The strange area has an understandable navigational rule, at least one reliable return route, and a playable scheduled-room challenge. No soft-locks or impossible deadline states occur. A first-time playtest demonstrates that the surprise is interesting rather than arbitrary.

**Constraints:** Basic area transitions are acceptable; seamless portals are an optional future project, not a requirement.

### 24. Ambient school life and character feasibility trial

**Status:** Proposed

**Complexity:** Medium–Large

**Objective:** Evaluate whether animated students, staff and environmental audio improve the sense of a living school without compromising browser performance or navigation.

**Scope:** Prototype a small number of approved rigged GLB characters using animation clips and simple waypoint navigation in one test area, alongside discreet ambient sound and footsteps. Keep collision, occlusion, and visibility policies simple. Measure animation, rendering, and asset-loading costs. Decide whether characters should remain decorative or later become interactive.

**Dependencies:** Milestones 18–20; approved character assets and licenses.

**Acceptance criteria:** A small group of characters walk believable routes without blocking essential navigation or materially disrupting the school clock. Assets load/reuse/cleanup correctly; the browser meets the agreed performance target; an observed playtest supports a decision to expand, revise or defer NPCs.

**Constraints:** No large autonomous crowd, conversations, dialogue AI or complex behavior trees in this trial.

## Deferred milestones

### 12. Navigation playtesting and difficulty balancing

**Status:** Deferred

**Complexity:** Medium

**Objective:** Establish that the two-floor classroom-finding challenge is understandable, fair, and enjoyable for someone unfamiliar with the building.

**Contribution to the vision:** Ensure difficulty comes from interpreting the school and managing time rather than hidden logic, obscure signage, or precision movement.

**Scope:** Observe one or more players unfamiliar with the layout completing milestone 11. Record route choices, floor-selection errors, misunderstood room numbers, missed signs, wrong turns, and remaining time. Adjust level data, labels, routes, and time allowance as justified. Keep the 60× multiplier unless separately approved otherwise.

**Dependencies:** Milestone 11; at least one unfamiliar playtester.

**Acceptance criteria:** Document observed completion/timeout, remaining time, wrong turns, and comprehension of the room-numbering scheme. Record at least one evidence-led revision or a reasoned decision to retain the design. The level remains solvable from in-world information. Existing Node and Chrome regressions pass after adjustments.

## Approval and maintenance

- The list above is a proposal, **not blanket approval**. The product owner may reorder, modify, reject, or approve any single milestone.

- Codex may make routine implementation decisions inside an approved scope but must stop for significant changes to the vision or milestone scope.

- After each completed milestone, record implementation and test evidence in [CHANGELOG.md](CHANGELOG.md), update status here, and propose the next milestone without beginning it.

- No commits or pushes without explicit authorization.
