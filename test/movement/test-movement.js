// Test file for movement functionality in Late For Class game

// Mock Three.js Vector3 class for testing
class MockVector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
        return this;
    }
    
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    
    copy(vector) {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
        return this;
    }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MockVector3,
        mockConfig,
        mockCamera,
        mockOnKeyDown,
        mockOnKeyUp,
        mockMove
    };
}

// Mock game configuration
const mockConfig = {
    moveSpeed: 5.0,
    friction: 0.9,
    gravity: 9.8,
    cameraHeight: 1.6,
    hallwayWidth: 10,
    hallwayDepth: 30,
    wallHeight: 5,
    floorSize: 50,
    pillarCount: 10,
    pillarSpacing: 1,
    wireframeColor: 0x808080,
    backgroundColor: 0x87CEEB,
    fogNear: 20,
    fogFar: 100
};

// Mock camera object
const mockCamera = {
    position: new MockVector3(0, 1.6, 0),
    quaternion: { x: 0, y: 0, z: 0, w: 1 }
};

// Mock game state variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new MockVector3();
let prevTime = performance.now();

// Mock functions to test movement logic
function mockOnKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function mockOnKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Mock movement function that mirrors the logic from main.js
function mockMove(delta, camera, velocity, moveForward, moveBackward, moveLeft, moveRight) {
    // Apply gravity (simplified for testing)
    velocity.y -= mockConfig.gravity * delta;

    // Movement controls with proper direction calculation
    if (moveForward || moveBackward || moveLeft || moveRight) {
        // Calculate movement direction based on camera rotation
        const direction = new MockVector3();
        
        if (moveForward) direction.z -= 1;
        if (moveBackward) direction.z += 1;
        if (moveLeft) direction.x -= 1;
        if (moveRight) direction.x += 1;
        
        // Normalize the direction vector to prevent faster diagonal movement
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }
        
        // Apply movement with proper speed (simplified - not applying quaternion rotation for this test)
        velocity.x = direction.x * mockConfig.moveSpeed;
        velocity.z = direction.z * mockConfig.moveSpeed;
    }

    // Apply movement to camera position
    camera.position.add(velocity);

    // Slow down movement over time (friction)
    velocity.x *= mockConfig.friction;
    velocity.z *= mockConfig.friction;

    return camera.position;
}

// Test functions
function testMovementForward() {
    console.log("Testing forward movement...");
    
    // Set up test state
    const startPosition = new MockVector3(0, 1.6, 0);
    const startVelocity = new MockVector3();
    moveForward = true;
    
    // Simulate movement for a short time
    const delta = 0.016; // ~60fps
    const resultPosition = mockMove(delta, { position: startPosition }, startVelocity, 
                                   moveForward, false, false, false);
    
    console.log("Start position:", startPosition.x, startPosition.y, startPosition.z);
    console.log("Result position:", resultPosition.x, resultPosition.y, resultPosition.z);
    
    // Verify forward movement occurred (should have moved in Z direction)
    const zChange = resultPosition.z - startPosition.z;
    console.log("Z change:", zChange);
    
    if (zChange < 0) {
        console.log("✓ Forward movement test PASSED: Moved backward (as expected with negative Z)");
        return true;
    } else {
        console.log("✗ Forward movement test FAILED: Should have moved in negative Z direction");
        return false;
    }
}

function testMovementBackward() {
    console.log("\nTesting backward movement...");
    
    // Set up test state
    const startPosition = new MockVector3(0, 1.6, 0);
    const startVelocity = new MockVector3();
    moveBackward = true;
    
    // Simulate movement for a short time
    const delta = 0.016; // ~60fps
    const resultPosition = mockMove(delta, { position: startPosition }, startVelocity, 
                                   false, moveBackward, false, false);
    
    console.log("Start position:", startPosition.x, startPosition.y, startPosition.z);
    console.log("Result position:", resultPosition.x, resultPosition.y, resultPosition.z);
    
    // Verify backward movement occurred (should have moved in positive Z direction)
    const zChange = resultPosition.z - startPosition.z;
    console.log("Z change:", zChange);
    
    if (zChange > 0) {
        console.log("✓ Backward movement test PASSED: Moved forward (as expected with positive Z)");
        return true;
    } else {
        console.log("✗ Backward movement test FAILED: Should have moved in positive Z direction");
        return false;
    }
}

function testMovementLeft() {
    console.log("\nTesting left movement...");
    
    // Set up test state
    const startPosition = new MockVector3(0, 1.6, 0);
    const startVelocity = new MockVector3();
    moveLeft = true;
    
    // Simulate movement for a short time
    const delta = 0.016; // ~60fps
    const resultPosition = mockMove(delta, { position: startPosition }, startVelocity, 
                                   false, false, moveLeft, false);
    
    console.log("Start position:", startPosition.x, startPosition.y, startPosition.z);
    console.log("Result position:", resultPosition.x, resultPosition.y, resultPosition.z);
    
    // Verify left movement occurred (should have moved in negative X direction)
    const xChange = resultPosition.x - startPosition.x;
    console.log("X change:", xChange);
    
    if (xChange < 0) {
        console.log("✓ Left movement test PASSED: Moved left (as expected with negative X)");
        return true;
    } else {
        console.log("✗ Left movement test FAILED: Should have moved in negative X direction");
        return false;
    }
}

function testMovementRight() {
    console.log("\nTesting right movement...");
    
    // Set up test state
    const startPosition = new MockVector3(0, 1.6, 0);
    const startVelocity = new MockVector3();
    moveRight = true;
    
    // Simulate movement for a short time
    const delta = 0.016; // ~60fps
    const resultPosition = mockMove(delta, { position: startPosition }, startVelocity, 
                                   false, false, false, moveRight);
    
    console.log("Start position:", startPosition.x, startPosition.y, startPosition.z);
    console.log("Result position:", resultPosition.x, resultPosition.y, resultPosition.z);
    
    // Verify right movement occurred (should have moved in positive X direction)
    const xChange = resultPosition.x - startPosition.x;
    console.log("X change:", xChange);
    
    if (xChange > 0) {
        console.log("✓ Right movement test PASSED: Moved right (as expected with positive X)");
        return true;
    } else {
        console.log("✗ Right movement test FAILED: Should have moved in positive X direction");
        return false;
    }
}

function runAllTests() {
    console.log("Running all movement tests...\n");
    
    const results = [];
    results.push(testMovementForward());
    results.push(testMovementBackward());
    results.push(testMovementLeft());
    results.push(testMovementRight());
    
    console.log("\n=== TEST RESULTS ===");
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
        console.log("🎉 All tests PASSED!");
    } else {
        console.log("❌ Some tests FAILED!");
    }
    
    return results;
}

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testMovementForward,
        testMovementBackward,
        testMovementLeft,
        testMovementRight
    };
}