# Tests for Late For Class Game

This directory contains tests for the game's functionality, specifically focusing on movement mechanics.

## Test Structure

### Movement Tests
- `movement/` - Directory containing movement-related tests
  - `test-movement.js` - Main test file with movement logic tests
  - `index.html` - HTML page to run tests in browser
  - `run-tests.js` - Node.js script to run tests from command line

## Running Tests

### Browser Tests
1. Open `test/movement/index.html` in a web browser
2. Click "Run All Tests" button

### Command Line Tests
1. Navigate to the project root directory
2. Run: `node test/movement/run-tests.js`

## Test Coverage
- Forward movement (W key)
- Backward movement (S key)  
- Left movement (A key)
- Right movement (D key)

The tests verify that:
- Movement coordinates change correctly in all directions
- Movement speed is consistent
- Diagonal movement is normalized to prevent speed advantage
- Friction and gravity are applied properly