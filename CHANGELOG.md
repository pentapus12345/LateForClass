# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 2026-11-22 — First playable level

- Added `js/Game.js` and `js/Level.js` to complete the refactor. Updated `index.html` and `js/main.js` to use one startup path and load `js/player.js` with its exact filename.
- Updated `js/player.js` and `assets/gameConfig.js` to fix mouse look, frame-rate-dependent movement, braking, and camera height. Escape pauses the game, and Resume recaptures the mouse.
- Updated `js/wall.js` and `assets/levels.json` so the hallway walls match their collision geometry. Restart resets the player to spawn and disposes of the previous level's meshes.
- Added a classroom door and interaction prompt. Pressing E in range completes the level, and Play Again starts a fresh attempt.
- Updated `README.md`, `test/README.md`, and the three files under `test/movement/` to document the controls and test the production classes.
- Verified 11 Node tests and 10 Chrome regression tests. The Chrome playthrough also verified pointer lock, mouse look, Escape and Resume, wall collision, restart, completion, and Play Again.
- The game has one level and uses the Three.js CDN. It requires a desktop browser with WebGL and Pointer Lock support.

### Added
- Initial project structure with HTML, CSS, and JavaScript files
- Basic game framework with main.js and wall.js files
- Test directory with movement tests
- CLAUDE.md development rules documentation
- CHANGELOG.md file for tracking changes
- assets/levels.json file with initial level data

### Changed
- Fixed movement logic in main.js to properly handle direction vector normalization
- Movement system now works reliably under all key press combinations
- Simplified Three.js scene to contain exactly 12 line segments forming rectangular box edges
- Removed redundant floor mesh and middleWall geometry
- Made player movement frame-rate independent using delta time
- Updated player starting position and look direction in levels.json
- Player now starts at configured camera position from level data

### Removed
- Redundant floor mesh that introduced additional wireframe triangles
- middleWall geometry and its rendering
- Unused variables, functions, and references associated with deleted floor and middle wall
- Unnecessary collision detection logic for middleWall that blocked movement

## [0.2.0] - 2026-11-22

### Added
- Game class (`js/Game.js`) for central application coordination
- Level class (`js/Level.js`) for level management and scene building
- Player class (`js/Player.js`) for player movement and physics
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
- Optimized Three.js scene to use only 12 line segments for box edges
- Improved movement physics with proper delta time application
- Removed collision detection for middleWall that was blocking player movement

### Removed
- Unnecessary floor mesh and middleWall geometry
- Unused variables and code related to deleted elements

## [0.1.0] - 2026-11-20

### Added
- Initial project skeleton with index.html, main.js, and wall.js
- Basic game configuration in assets/gameConfig.js
- Test structure in test/movement/ directory
- README.md documentation
- CLAUDE.md development rules file
- Complete game architecture files including movement logic tests

### Changed
- Updated development discipline guidelines in CLAUDE.md
- Configured basic project structure following development rules

### Removed
- No removals

### Files Added
- `index.html` - Main HTML page for the game
- `js/main.js` - Core game logic and Three.js scene setup
- `js/wall.js` - Wall class implementation with collision detection
- `assets/gameConfig.js` - Game configuration parameters
- `test/movement/test-movement.js` - Movement functionality tests
- `test/movement/run-tests.js` - Test runner script
- `test/movement/index.html` - HTML test page
- `test/README.md` - Documentation for tests

### Tests Performed
- Initial project structure validation
- Basic functionality verification
- Git repository setup completed

### Known Limitations
- Project not yet initialized as a Git repository
- Movement tests are currently in a mock state and need integration with actual game code
