// Simple test runner for movement functionality
const fs = require('fs');

// Read the test file content
const testContent = fs.readFileSync('./test/movement/test-movement.js', 'utf8');

// Create a minimal environment to run tests
function createTestEnvironment() {
    // Mock browser globals
    global.performance = {
        now: function() {
            return Date.now();
        }
    };
    
    // Mock Three.js Vector3
    class Vector3 {
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
    
    global.THREE = {
        Vector3: Vector3
    };
    
    // Execute the test content in this environment
    eval(testContent);
    
    return {
        runAllTests,
        testMovementForward,
        testMovementBackward,
        testMovementLeft,
        testMovementRight
    };
}

// Run tests and output results
try {
    const env = createTestEnvironment();
    console.log("Running movement tests...\n");
    const results = env.runAllTests();
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`\nResults: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log("🎉 All tests PASSED!");
    } else {
        console.log("❌ Some tests FAILED!");
    }
} catch (error) {
    console.error("Error running tests:", error);
}