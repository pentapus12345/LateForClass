# Changelog

All notable changes to this project will be documented in this file.

Release headings use [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Older entries use the
file paths and test status from the time of the change.

## [Unreleased]

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
