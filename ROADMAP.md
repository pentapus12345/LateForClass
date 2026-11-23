# LateForClass development roadmap

The product direction is defined in [VISION.md](VISION.md). This roadmap records completed work and proposes the next milestones. Under [AGENTS.md](AGENTS.md), **each proposed milestone requires separate product-owner approval before implementation**. Editing this roadmap does not approve a milestone.

## Status definitions

| Status | Meaning |
| --- | --- |
| Proposed | Awaiting the product owner's decision |
| Approved | The product owner approved this specific scope |
| In Progress | Approved work is being implemented |
| Completed | Implementation and verification are recorded |
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

## Current limitations

- The timed prototype uses one classroom and one same-day deadline in Corridor and Classroom.
- Multiple reachable classroom choices and a discoverable numbering system are not yet in place.
- The visual foundation is solid but the final art direction is undecided. Wireframe/debug development levels should remain available.
- The earlier pitch-snap bug has regression coverage; the previously reported intermittent sideways roll was not reproduced in the cited hallway investigation.
- The browser build requires WebGL, Pointer Lock, and access to the Three.js CDN.

## Proposed milestones — priority order

### 9. Multiple numbered classrooms

**Status:** Proposed  
**Complexity:** Medium

**Objective:** Make the scheduled destination one of several reachable, visibly numbered classrooms.

**Contribution to the vision:** Introduces meaningful destination choices rather than a single obvious room.

**Scope:** Extend one connected school layout with a small set of data-defined classrooms, each with a unique visible ID and valid arrival volume. Preserve existing doors and floors; one scheduled class remains active.

**Dependencies:** Milestone 7 automatic arrival, milestone 5 schedule, and milestone 8 deadline for a timed playtest.

**Acceptance criteria:** Every classroom is reachable and correctly labeled; wrong-room entry leaves the objective active; changing the scheduled `roomId` changes the winning room; the timer continues normally; navigation and collision tests pass.

### 10. Discoverable room-numbering logic

**Status:** Proposed  
**Complexity:** Medium

**Objective:** Give classroom identifiers a learnable relationship to the school's physical layout.

**Contribution to the vision:** Makes navigation a pattern-discovery challenge rather than trial and error.

**Scope:** Agree on one numbering scheme with the product owner, apply it consistently to the rooms from milestone 9, and communicate the pattern through room labels and environmental layout. Do not add automatic navigation aids without approval.

**Dependencies:** Milestone 9 and explicit approval of the numbering pattern.

**Acceptance criteria:** The numbering convention is consistent; a player can infer locations using it; a browser walkthrough demonstrates the inference; scheduled-room entry remains correct after relabeling.

### 11. First complete playable class-navigation challenge

**Status:** Proposed  
**Complexity:** Medium

**Objective:** Validate the complete gameplay loop: read the schedule, navigate a school, choose a room, and arrive on time or lose.

**Contribution to the vision:** Produces a small but complete playable LateForClass challenge.

**Scope:** Integrate existing schedule, timed clock, automatic arrival, several numbered rooms, and a discoverable numbering pattern into one run. Keep success/failure feedback and restart clear.

**Dependencies:** Milestones 7–10 and approval of any remaining game-design details needed for the prototype.

**Acceptance criteria:** End-to-end browser runs demonstrate an on-time arrival, a timeout loss, and visiting an incorrect room; restarting resets all state; tests cover the outcomes and room mapping.

### 12. Art direction and visual design prototype

**Status:** Proposed  
**Complexity:** Medium

**Objective:** Evaluate a coherent visual identity for the school without sacrificing navigational clarity.

**Contribution to the vision:** Turns the functional school into a more compelling and readable game world.

**Scope:** On part of the playable route, prototype a product-owner-approved combination of materials, colors, lighting, signage, and restrained environmental detail using the solid/debug foundation from milestone 4.5.

**Dependencies:** Milestone 4.5, milestone 11, and approval of the visual treatment to prototype.

**Acceptance criteria:** A playable sample covers corridor, door, classroom, stairway, and readable room signage; movement, clock, interactions, and collisions still work; debug diagnostics remain available; readability, performance, and implementation effort are documented for a design decision.

## Approval and maintenance

- The list above is a proposal, **not blanket approval**. The product owner may reorder, modify, reject, or approve any single milestone.
- Codex may make routine implementation decisions inside an approved scope but must stop for significant changes to the vision or milestone scope.
- After each completed milestone, record implementation and test evidence in [CHANGELOG.md](CHANGELOG.md), update status here, and propose the next milestone without beginning it.
- No commits or pushes without explicit authorization.
