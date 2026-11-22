const gameConfig = {
    moveSpeed: 6,
    friction: 12,
    gravity: 9.8,
    cameraHeight: 1.6,
    playerHeight: 1.8,
    playerRadius: 0.3,

    hallwayWidth: 10,
    hallwayDepth: 30,
    wallHeight: 5,

    pillarCount: 10,
    pillarSpacing: 1,

    wireframeColor: 0x6f7f90,
    backgroundColor: 0x1e2935,
    fogNear: 20,
    fogFar: 100
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameConfig;
} else {
    window.gameConfig = gameConfig;
}
