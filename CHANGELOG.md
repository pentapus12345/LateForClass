# Changelog

All notable changes to this project will be documented in this file.

Release headings use [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Older entries use the
file paths and test status from the time of the change.

## [Unreleased]

### 2026-11-23 — Add the accelerated school clock and deadline

- Corridor and Classroom starts at 08:00 and advances one school minute per active second. The schedule shows the current time and the class start time. Pause, loss of focus, and loss of pointer lock freeze the clock.
- Entering the scheduled classroom before class starts wins. At the deadline, **You’re Late!** ends the run and **Retry** restores the clock, spawn, and door. The starting time and speed are set in the level data.
- All 72 Node tests and 52 Chrome regression tests passed. Chrome verified automatic arrival, 08:10 after ten active seconds, pausing in Options, a full 60-second timeout, and retry. Deterministic tests covered the exact deadline and focus and visibility transitions.

### 2026-11-23 — Register classroom arrival at the doorway

- Corridor and Classroom now completes when the player fully enters the scheduled room. E opens the door. The classroom volume and door association come from level data, and the green destination marker has been removed.
- All 66 Node tests and 50 Chrome regression tests passed. A Chrome playthrough checked the closed door, partial threshold clearance, other floor heights, automatic Room 101 arrival, and restart. An alternate schedule verified that entering the wrong room leaves the objective active and the stairs traversable.

### 2026-11-22 — Add configurable controls and an Options screen

- Added Standard and Swapped keyboard layouts, independent keyboard and mouse look, adjustable keyboard camera speed and mouse sensitivity, inverted vertical mouse look, and optional left-click jumping. The Options screen is available before play and while paused. Changes save in the browser, and Restore Defaults resets all controls.
- Physical inputs map to gameplay actions before reaching Player. Keyboard and mouse look share the existing yaw and pitch model, with zero roll. Keyboard look starts at 120°/s and the existing mouse sensitivity is 1×.
- All 65 Node tests and 50 Chrome regression tests passed. A Chrome playthrough verified the Options screen, reload and restore, movement and camera controls in both layouts, Space and click jumping, the Room 101 route, and pause and restart.

### 2026-11-22 — Add the player schedule panel

- Added a **Next class** panel to Corridor and Classroom. The level data supplies the prototype entry, Mathematics in Room 101 at 09:00. The scheduled room drives the objective and arrival check. The start time is informational.
- All 58 Node tests and 46 Chrome regression tests passed. Tests verified updated configuration values, room matching, and panel visibility. A Chrome playthrough verified that the panel fits alongside the objective and view hint at desktop and 360-pixel widths, and that it works with movement, the door, arrival, pause, resume, and restart.

### 2026-11-22 — Fix the view toggle before start and while paused

- V previously required pointer lock. It now switches views in Corridor and Classroom before starting, during play, and while paused. The start and pause screens also have a button that switches views and redraws immediately.
- All 57 Node tests and 46 Chrome regression tests passed. A Chrome playthrough verified the shortcut and button on the start and pause screens and the shortcut during play.

### 2026-11-22 — Add solid rendering and collision debug view

- Corridor and Classroom now starts with opaque surfaces and basic lighting. The door, sign, stairs, and green arrival marker stand out in solid view.
- V switches between solid surfaces and wireframe collision outlines built from the same bounds. The view persists on restart. The Hallway and Physics Playground retain their wireframes.
- All 57 Node tests and 46 Chrome regression tests passed. A Chrome playthrough checked matching bounds in both views, the door, staircase ascent in solid view and descent in debug view, a jump on the landing, arrival, and reset.

### 2026-11-22 — Identify the classroom and record arrival

- Added prototype identifier Room 101 and a matching destination to Corridor and Classroom in `assets/levels.json`. `js/Level.js` renders the doorway label and checks room identity, horizontal bounds, and floor height. `js/Game.js` displays the named objective and records arrival with E.
- Updated the README, test documentation, and roadmap. All 54 Node tests and 44 Chrome regression tests passed. A Chrome playthrough verified the Room 101 objective, door interaction, arrival, and reset. Tests cover a mismatched room identifier and sign texture cleanup.

### 2026-11-22 — Complete one classroom objective

- Added a floor-level destination to Corridor and Classroom in `assets/levels.json`. `Level` draws a green marker and checks its footprint and floor height. `Game` displays the objective, keeps the door interaction available, and completes the run when E is pressed inside the marker.
- Updated the README, test documentation, and roadmap. All 53 Node tests and 43 Chrome regression tests passed. A Chrome playthrough verified opening the door, rejecting E outside the marker and on the upper landing, completing inside the marker, and resetting the objective and door with R.

### 2026-11-22 — Connect two floors by stairs

- Extended Corridor and Classroom in `assets/levels.json` with twelve treads, a stairwell, and an enclosed upper landing three world units above the classroom floor. The route uses the existing rendering and collision system.
- Updated the README, test documentation, and roadmap. All 51 Node and 42 Chrome regression tests passed. A Chrome playthrough verified opening the existing door, walking every tread in both directions while grounded, and stopping at the landing wall. Automated coverage checks head clearance and landing boundaries.

### 2026-11-22 — Add one interactive classroom door

- Added a data-defined door to Corridor and Classroom. `Level` keeps the panel and collider aligned as the door swings away from the player. `Game` shows the prompt in range, routes E to open it, and restores the closed state on restart.
- Updated the README, test documentation, and roadmap. All 48 Node tests and 39 Chrome regression tests passed. A Chrome playthrough verified both approaches, out-of-range input, traversal, reset, and matching panel and collider bounds in both states.

### 2026-11-22 — Add a level picker

- Added `/levels/` using `levels/index.html` and `js/level-picker.js`. It lists every level by name from `assets/levels.json` and opens the selected level through its existing URL.
- Added a picker link to the game screen and documented it in `README.md` and `ROADMAP.md`.
- All 47 Node tests passed, including future level entries and empty or unavailable data. Chrome verified all three level links, the return link, and the list at a narrow viewport.

### 2026-11-22 — Connect one corridor and one classroom

- Added the Corridor and Classroom development scene to `assets/levels.json` at `/?level=3`. A level doorway connects the two spaces, with the visible wireframe and collision using the existing box data. The default hallway and Physics Playground retain their level definitions.
- Documented the route in `README.md` and recorded the approved milestone as completed in `ROADMAP.md`.
- Updated the browser and Node test entry points and added doorway regressions in `tests/movement/`. All 45 Node tests and 38 Chrome regression tests passed. A Chrome playthrough verified the grounded round trip, collision beside the doorway, and R restoring spawn and view.

### 2026-11-22 — Physics Playground and stair movement

- Added the Physics Playground to `assets/levels.json` with a jump gap, three raised platforms, six stair treads, a low ceiling, and an elevated deck. `js/Game.js` selects it with `?level=2` and restarts the selected level. The original hallway remains the default with its existing definition and controls.
- Updated `js/Level.js` to draw each playground wireframe from the same box bounds used for collision. `js/Player.js` now clears short steps when grounded and follows nearby lower treads, subject to head clearance and the `maxStepHeight` setting in `assets/gameConfig.js`.
- Updated the project and test readmes and the runner, shared tests, and browser test page in `tests/movement/`. All 41 Node and 35 Chrome regression tests passed, including camera checks. A Chrome playthrough verified the gap jump, stair ascent and descent, elevated fall, restart, and matching rendered and collision bounds.
- The playground uses static axis-aligned boxes. Grounded stair motion follows each discrete tread height, and larger drops use gravity.

### 2026-11-22 — Unify first-person camera orientation

- Diagnosed two camera orientation paths in `js/Player.js`. Startup and restart used Three.js `lookAt()`, which could initialize pitch outside the mouse clamp. Chrome reproduced a pitch snap on the first horizontal-only mouse event after a vertical spawn. The stock hallway did not reproduce sideways roll during that check.
- Gave Player explicit yaw and pitch and one `YXZ` rotation method that applies zero roll. Startup targets, restart, and mouse look share the same clamp. WASD uses the same yaw to determine horizontal direction.
- Added the camera rule to `AGENTS.md` and documented the regression checks in `tests/README.md`. The Node and shared tests in `tests/movement/` check the world-space camera basis, including the horizontal right axis that keeps the horizon level.
- Passed 31 Node tests and 26 Chrome tests using Three.js. A pointer-locked Chrome session exercised horizontal turns while looking up and down, circular mouse input, multiple full turns, and restart. The horizon test also detected a deliberate rotation-order error in an isolated copy.

### 2026-11-22 — Player jumping and vertical collision

- Updated `js/Player.js` and `assets/gameConfig.js` with grounded jumps on Space, configurable gravity and jump height, and short physics steps that interleave vertical motion with camera-relative walking and wall sliding.
- Updated `js/Level.js` and `js/Wall.js` to find the first floor, ceiling, or platform face crossed in a vertical step. Optional solid platforms support landing, underside collision, and stepping off. The current level data and rendered geometry remain the same.
- Updated `js/Game.js` to route Space and stop accepting movement and mouse input on focus or pointer-lock loss. Pausing preserves vertical momentum for resume.
- Updated `README.md`, `tests/README.md`, and the Node and shared tests in `tests/movement/`. All 22 Node tests and 18 Chrome regression tests passed. A Chrome playthrough verified Space, landing, pointer lock, mouse look, pause and resume, wall collision, restart, and completion.
- Elevated platforms and ceiling impacts from high jumps are covered by test fixtures. The shipped hallway has a flat floor and no elevated platforms.

### 2026-11-22 — Repository cleanup and standardization

- Renamed `js/player.js` to `js/Player.js` and `js/wall.js` to `js/Wall.js` using intermediate Git moves. Moved `test/` to `tests/` and updated the game, browser test page, offline runner, and documentation references.
- Standardized JavaScript constants and names, HTML IDs and CSS selectors, and control-flow formatting. Removed the duplicate global config export and kept the existing startup path and class responsibilities.
- Added `AGENTS.md` as the shared development guide, pointed `CLAUDE.md` to it, and updated the project and test readmes.
- Passed all 14 Node tests and all 11 shared tests in Chrome. The playthrough verified controls, collisions, completion, and reset. Compared the rendered spawn, overlay styles, geometry, camera, and wall bounds with the baseline using a server that enforces exact filename casing.
- The game requires a desktop browser with WebGL, Pointer Lock, and access to the Three.js CDN.

### 2026-11-22 — Restore the minimal wireframe hallway

- Kept the verified `js/main.js` bootstrap and the single `Game` / `Player` / `Level` implementation. Moved camera creation and resizing into `js/player.js`. Updated `js/Game.js` to load level data before starting the renderer, and adjusted `index.html` and the on-screen instructions for the wireframe layout.
- Updated `js/Level.js`, `js/wall.js`, `assets/gameConfig.js`, and `assets/levels.json` to use the same hallway dimensions for the twelve outer edges and four invisible wall colliders. Restored the ten intended pillars and removed the rendered floor, grid, walls, and door. The existing classroom prompt still appears at the far end.
- Updated `README.md`, `test/README.md`, and the Node and shared tests in `test/movement/`. All 14 Node tests and all 11 Chrome regression tests passed. A separate Chrome playthrough verified the scene, mouse look, movement, pause, restart, wall collision, and completion.
- The starting level requires a desktop browser with WebGL, Pointer Lock, and access to the Three.js CDN.

### 2026-11-22 — First playable level

- Added `js/Game.js` and `js/Level.js` to complete the refactor. Updated `index.html` and `js/main.js` to use one startup path and load `js/player.js` with its exact filename.
- Updated `js/player.js` and `assets/gameConfig.js` to fix mouse look, frame-rate-dependent movement, braking, and camera height. Escape pauses the game, and Resume recaptures the mouse.
- Updated `js/wall.js` and `assets/levels.json` so the hallway walls match their collision geometry. Restart resets the player to spawn and disposes of the previous level's meshes.
- Added a classroom door and interaction prompt. Pressing E in range completes the level, and Play Again starts a fresh attempt.
- Updated `README.md`, `test/README.md`, and the three files under `test/movement/` to document the controls and test the production classes.
- Verified 11 Node tests and 10 Chrome regression tests. The Chrome playthrough also verified pointer lock, mouse look, Escape and Resume, wall collision, restart, completion, and Play Again.
- The game has one level and uses the Three.js CDN. It requires a desktop browser with WebGL and Pointer Lock support.

## [0.2.0] - 2026-11-22

### Added

- Game class (`js/Game.js`) for central application coordination
- Level class (`js/Level.js`) for level management and scene building
- Player class (`js/player.js`) for player movement and physics
- Wall class with improved collision detection (`js/wall.js`)
- Asynchronous level loading from assets/levels.json

### Changed

- Refactored main.js into a bootstrap file that initializes the Game object
- Implemented object-oriented architecture with clear separation of concerns
- Improved level loading to use JSON data instead of hardcoded values
- Enhanced Wall class to properly handle collision detection and rendering
- Centralized game logic in the Game class while delegating responsibilities to other classes

### Removed

- Duplicated physics code from main.js
- Hardcoded level geometry in main.js
- Global variables for movement state (now managed by Player)
- Redundant event listeners and input handling code

## [0.1.1] - 2026-11-20

### Added

- Level data structure in assets/levels.json including player starting position and look direction
- Frame-rate independent movement calculations
- Proper camera positioning based on level data

### Changed

- Refactored main.js to clean up scene creation and movement logic
- Normalized direction vectors for movement key combinations
- Optimized Three.js scene to use only 12 line segments for box edges
- Improved movement physics with proper delta time application
- Removed collision detection for middleWall that was blocking player movement

### Removed

- Unnecessary floor mesh and middleWall geometry
- Unused variables and code related to deleted elements

## [0.1.0] - 2026-11-20

### Added

- Initial HTML, CSS, and JavaScript project structure with `index.html`, `js/main.js`, `js/wall.js`, and `assets/gameConfig.js`.
- Movement test runner, browser test page, and documentation in `test/`. The initial movement tests used mock logic.
- Project documentation, development guidelines in `CLAUDE.md`, and this changelog.
