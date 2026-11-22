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
| Physics Playground and stairs | Completed | The development scene is selectable at `/?level=2`. The gap, stair ascent and descent, ledge fall, restart, and matching wireframe and collision bounds passed the recorded Chrome checks. This milestone is part of the committed development baseline. |
| 1. Connect one corridor and one classroom | Completed | The data-defined scene opens at `/?level=3`. Chrome verified walking through the opening in both directions at floor height, collision beside it, and R restoring spawn and view. Targeted tests cover both sides of the doorway and player clearance. |
| Development level picker | Completed | `/levels/` lists levels by name from the level data. Chrome verified navigation to each current level and back. |
| 2. Add one interactive door | Completed | The data-defined door in `/?level=3` starts closed, opens with E in range from either side, and closes on R. Tests and Chrome verified traversal and matching panel and collision bounds. |
| 3. Connect two floors by stairs | Completed | Twelve data-defined stairs connect the classroom to an upper landing. Tests verify grounded traversal at two frame rates, head clearance, and landing boundaries. A Chrome playthrough used every tread up and down. |
| 4. Complete one classroom objective in the connected layout | Completed | Open the door with E, reach the green marker in the lower classroom, and press E to finish. Tests and Chrome verified the marked area, the upper landing as an invalid destination, and R restoring the door and objective. |
| 4. Classroom identity and arrival | Completed | The Room 101 doorway label matches the configured destination. E confirms arrival at the matching room and floor. Targeted tests and Chrome verified the objective, door, arrival, and reset. |
| 4.5. Visual foundations | Completed | Corridor and Classroom opens in solid view. V switches to collision outlines from the same bounds. Chrome verified room-sign readability, door interaction, stairs, jumping, arrival, and reset across the two views. |

The green-marker prototype passed 53 Node tests and 43 Chrome regression tests. Classroom identity and arrival passed 54 Node tests and 44 Chrome regression tests. Visual foundations passed 57 Node tests and 46 Chrome regression tests. The default hallway and Physics Playground retained their existing routes and level definitions. [CHANGELOG.md](CHANGELOG.md)

## Known bugs and limitations

- The earlier camera pitch snap was fixed and has regression coverage. The reported intermittent sideways roll was not reproduced in the stock hallway during the prior investigation. The current Node run passed the camera tests. [CHANGELOG.md](CHANGELOG.md)
- The default hallway's classroom prompt checks horizontal distance to a point. Corridor and Classroom checks identity, position, and floor height for its Room 101 objective. The class schedule and deadline evaluation are still proposed. [Game.js](js/Game.js) · [Level.js](js/Level.js)
- The playground uses static, axis-aligned boxes and discrete stair treads. A fall into its pit is recoverable with R. [README.md](README.md)
- The current build requires a desktop browser with WebGL, Pointer Lock, and access to the Three.js CDN. [README.md](README.md)
- Corridor and Classroom has a solid blockout and a wireframe collision view. The artistic treatment remains open.

## Proposed milestones in priority order

### 5. Player schedule panel

**Status** Proposed

**Objective** Show the player their next class, classroom identifier, and scheduled start time during play.

**Contribution to the vision** Give the player the information needed to choose a destination and plan their route.

**Scope** Display one configured upcoming class in a schedule panel. Bind its classroom identifier to the room introduced in milestone 4.

**Dependencies** Milestone 4.

**Acceptance criteria**

- The player can read the class name, room identifier, and start time while playing.
- The displayed values match the configured schedule, and the room identifier matches the visible classroom label.
- The panel works alongside the existing movement and interaction controls. Changing the configured class updates the displayed entry.

### 6. Configurable controls and options screen

**Status** Proposed

**Objective** Allow players to customize keyboard and mouse controls through a dedicated options screen, while preserving intuitive first-person movement and camera behavior.

**Contribution to the vision** Provide a comfortable, accessible, and polished control experience that accommodates different player preferences without compromising navigation or gameplay.

**Scope**

Implement a configurable input system that separates player actions from their physical input devices.

**Keyboard controls**
- Support two predefined keyboard layouts:
  - **Standard:** WASD for movement, arrow keys for camera control.
  - **Swapped:** Arrow keys for movement, WASD for camera control.
- Allow keyboard camera control to be enabled or disabled independently of mouse look.
- Support configurable keyboard camera rotation speed.
- Preserve diagonal movement normalization and frame-rate independence.
- Keep Space as the default jump key and E as the default interaction key.

**Mouse controls**
- Mouse movement controls camera yaw and pitch, never player translation.
- Allow mouse look to be enabled or disabled.
- Provide adjustable mouse sensitivity.
- Provide an option to invert the vertical mouse axis.
- Allow the left mouse button to be enabled as an additional jump input, alongside Space.
- Preserve the existing camera rotation system: world-up Y, explicit yaw and pitch, zero roll, and pitch clamping.

**Options screen**
- Add a dedicated Options screen accessible from the main menu.
- Organize settings into Keyboard and Mouse sections.
- Use clear labels and intuitive controls such as dropdowns, toggles, and sliders.
- Provide a Restore Defaults button.
- Provide a Back button returning to the main menu.
- Save settings locally so they persist across browser reloads.
- Ensure settings can be changed without modifying game code.

**Input architecture**
- Centralize input mappings and settings rather than scattering key-specific logic throughout the Player class.
- Separate gameplay actions (move, look, jump, interact) from physical keys and mouse buttons.
- Allow keyboard camera controls and mouse look to operate simultaneously.
- Prevent conflicting input assignments and unintended duplicate actions.
- Ensure gameplay input does not interfere with menu interaction.
- Keep the design simple and extensible for future control customization.

**Default configuration**

| Setting | Default |
|---|---|
| Keyboard layout | WASD movement, arrow-key camera |
| Mouse look | Enabled |
| Keyboard camera control | Enabled |
| Mouse sensitivity | Existing game sensitivity |
| Keyboard camera speed | Sensible default matching existing behavior |
| Invert mouse Y axis | Disabled |
| Jump | Space |
| Additional jump with left mouse button | Disabled |
| Interact | E |

**Dependencies** Existing Player input handling, camera rotation system, and main menu. No dependency on classroom identity or schedule functionality.

**Acceptance criteria**

- The player can switch between the Standard and Swapped keyboard layouts.
- WASD and arrow keys correctly perform their assigned roles in either layout.
- Keyboard camera control and mouse look can be used simultaneously.
- Disabling keyboard camera control does not disable keyboard movement.
- Disabling mouse look does not disable keyboard camera control.
- Mouse sensitivity changes are applied correctly.
- Invert-Y changes only the vertical direction of mouse look.
- Mouse movement never translates the player.
- Space always initiates jumping when the player is grounded.
- Left mouse button also initiates jumping when the option is enabled.
- Left-clicking menu controls never causes a jump or other gameplay action.
- The E key continues to interact with doors and classroom objectives.
- The Options screen is accessible from the main menu.
- The Back button returns to the main menu without starting a game.
- Restore Defaults restores all documented default settings.
- Settings persist across page reloads using browser-local storage.
- Camera rotation remains free of roll, flipping, or pitch snapping.
- Existing movement, jumping, collisions, and interactions remain unchanged except for the explicitly configurable behavior.
- Automated tests cover both keyboard layouts, input toggles, mouse sensitivity, inverted Y, jumping, settings persistence, and reset-to-default behavior.
- Browser testing verifies menu navigation and actual player controls.

**Constraints**

- Do not implement joystick-like movement using mouse displacement.
- Do not introduce gamepad support as part of this milestone.
- Do not introduce a general-purpose key-remapping interface yet.
- Do not change movement physics, level geometry, or gameplay objectives.
- Do not add external input-management libraries unless clearly necessary.
- Follow AGENTS.md and update CHANGELOG.md.
- Do not commit or push automatically.

**Complexity** Medium

### 7. In-game clock and deadline

**Status** Proposed

**Objective** Advance an in-game clock and evaluate arrival against the scheduled start time.

**Contribution to the vision** Add time management to the room-finding loop.

**Scope** One clock and one scheduled deadline. Record arrival time and distinguish on-time and late arrivals. The clock presentation, pause behavior, and consequences of lateness require separate design decisions within their respective scopes.

**Dependencies** Milestones 4 and 5.

**Acceptance criteria**

- The clock advances under the approved run rules and can be read against the deadline.
- Arrival at the correct room before class starts is on time. Arrival at or after the scheduled start is late.
- Tests cover the deadline boundary and restart, including restoration of the configured start time and a fresh arrival result.

### 8. Multiple numbered classrooms

**Status** Proposed

**Objective** Let the player distinguish the scheduled classroom from other reachable rooms.

**Contribution to the vision** Make finding the correct classroom a navigation problem with a meaningful choice of destination.

**Scope** Add a small set of reachable, distinctly numbered classrooms to one connected development layout. Keep a single scheduled class for the run.

**Dependencies** Milestone 4 for room identity and milestone 5 for the scheduled target.

**Acceptance criteria**

- Each classroom has a unique identifier in level data and a corresponding visible label.
- The rooms are reachable using the existing corridor, doorway, and stair controls where applicable.
- Entering another classroom leaves the scheduled objective active. The correct room is accepted, and changing the scheduled room changes which destination qualifies.

### 9. Discoverable room-numbering logic

**Status** Proposed

**Objective** Give the classroom identifiers a consistent relationship to the school layout.

**Contribution to the vision** Let the player learn the building and use that knowledge to infer where a classroom is.

**Scope** Apply one product-owner-approved numbering pattern to the small classroom set from milestone 7. Use the layout and visible room labels to communicate it.

**Dependencies** Milestone 8 and approval of the numbering pattern.

**Acceptance criteria**

- Room labels and placement consistently follow the approved pattern.
- A browser walkthrough shows examples of the pattern and demonstrates how they identify a route to a scheduled room.
- Room identity and arrival checks still recognize the scheduled room after the layout and labels are updated.

### 10. First complete playable class-navigation challenge

**Status** Proposed

**Objective** Combine the schedule, room-choice route, clock, and arrival evaluation in one playable run.

**Contribution to the vision** Validate the full loop from receiving a schedule to finding the room and learning whether the player made it on time.

**Scope** One class, one connected layout with multiple rooms, and one deadline. Use the approved arrival feedback and restart flow for this prototype.

**Dependencies** Milestones 4 through 8 and approval of the prototype's arrival feedback.

**Acceptance criteria**

- A player can read the schedule, use the room-numbering pattern to navigate, and reach the correct classroom.
- An end-to-end playthrough verifies an on-time arrival, a late arrival, and a visit to an incorrect classroom.
- Restart restores the schedule, clock, and objective for a new run. Automated checks cover the core outcomes.

### 11. Art direction and visual design prototype

**Status** Proposed

**Objective** Explore and evaluate a coherent, product-owner-approved visual identity for the school after the first complete gameplay challenge works.

**Contribution to the vision** Make school navigation visually engaging and readable, with an artistic direction that supports rather than obscures room identification, route finding, and time pressure.

**Scope** Build a focused art-direction prototype on part of the playable route, using the solid-rendering and debug foundation established in milestone 4.5. Compare selected materials, color language, lighting, signage, and limited environmental detail. The final choice of style remains a product-owner decision.

**Dependencies** Milestones 4.5 and 10, plus approval of the visual direction to prototype.

**Acceptance criteria**

- A playable browser sample demonstrates one approved artistic treatment across a corridor, classroom, door, stair route, and room signage.
- Room identifiers, doorways, and route cues remain readable while the player moves; the schedule and timed objective remain usable.
- Collision, movement, and arrival behavior remain unchanged, with debug visualization still available.
- The prototype documents tradeoffs in readability, performance, and production effort and provides enough evidence for the product owner to approve or revise the broader art direction.
