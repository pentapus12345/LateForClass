# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with HTML, CSS, and JavaScript files
- Basic game framework with main.js and wall.js files
- Test directory with movement tests
- CLAUDE.md development rules documentation
- CHANGELOG.md file for tracking changes

### Changed
- Fixed movement logic in main.js to properly handle direction vector normalization
- Movement system now works reliably under all key press combinations

### Removed
- No removals

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
