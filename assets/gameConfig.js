// Game configuration parameters
const gameConfig = {
    // Movement parameters
    moveSpeed: 0.1,
    friction: 0.9,
    gravity: 9.8,
    
    // Camera parameters
    cameraHeight: 1.6,
    
    // Hallway dimensions
    hallwayWidth: 10,
    hallwayDepth: 30,
    wallHeight: 5,
    
    // Floor parameters
    floorSize: 50,
    
    // Pillar parameters
    pillarCount: 10,
    pillarSpacing: 1,
    
    // Visual parameters
    wireframeColor: 0x808080,
    backgroundColor: 0x87CEEB,
    
    // Fog parameters
    fogNear: 20,
    fogFar: 100
};

// Export the configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameConfig;
} else {
    window.gameConfig = gameConfig;
}