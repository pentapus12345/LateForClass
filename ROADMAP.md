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
| [11. First complete playable class-navigation challenge](#11-first-complete-playable-class-navigation-challenge) | Completed | Room 102 is the default challenge, with Room 002 as the alternate test target. All 82 Node and 59 Chrome tests passed. Chrome verified both routes, a wrong-room visit, the stock timeout, and reset. |
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

## Current limitations

- The timed school uses six classrooms and one same-day deadline. First-time player comprehension and time allowance remain playtesting items.
- Furniture uses placeholder geometry and world-aligned box colliders. Quarter turns fit the boxes exactly. Other angles use enclosing bounds.
- The two-floor route demonstrates the proposed visual style. Room 003 remains the fully furnished classroom, and the final art direction is open.
- The earlier pitch-snap bug has regression coverage; the previously reported intermittent sideways roll was not reproduced in the cited hallway investigation.
- The browser build requires WebGL and Pointer Lock. The repository serves its pinned Three.js build locally.

## Proposed milestones — priority order

### 15. Furnish the destination classroom

**Status:** Proposed

**Objective:** Make Room 102 immediately recognizable as a classroom when the player arrives.

**Scope:** Use the existing furniture and lighting systems to place a small seating area in Room 102 and preserve its entrance and arrival region.

**Dependencies:** Milestones 11.7, 13, and 14.

**Acceptance criteria:** The default route still wins on entry. The furniture placement leaves the doorway and aisles clear, with verified debug outlines and measured render cost.

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
