// Late For Class - Basic Three.js Scene

let scene, camera, renderer;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let velocity = new THREE.Vector3();
let prevTime = performance.now();
let startScreen;

// Import game configuration
const config = window.gameConfig;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);
    scene.fog = new THREE.Fog(config.backgroundColor, config.fogNear, config.fogFar);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Set initial camera position from level data
    const levelData = getLevelData(1);
    if (levelData && levelData.playerStart) {
        camera.position.set(
            levelData.playerStart.x,
            levelData.playerStart.y + config.cameraHeight,
            levelData.playerStart.z
        );
    } else {
        camera.position.set(0, config.cameraHeight, 0); // Eye level position
    }
    
    // Yaw first, then pitch, with no roll
    camera.rotation.order = 'YXZ';

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create wireframe hallway with exactly 12 edges
    createHallway();

    // Add event listeners
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    
    // Start screen functionality
    startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', startGame);
    
    // Add click to start game
    document.addEventListener('click', function() {
        if (startScreen.style.display !== 'none') {
            startGame();
        }
    });

    // Start animation loop
    animate();
}

// Create the wireframe hallway with exactly 12 edges
function createHallway() {
    // Create a wireframe hallway using only 12 lines (edges of the box)
    const hallwayWidth = config.hallwayWidth;
    const hallwayDepth = config.hallwayDepth;
    const wallHeight = config.wallHeight;

    // Define the 8 corner points of the hallway box
    const corners = [
        // Bottom corners
        new THREE.Vector3(-hallwayWidth/2, 0, -hallwayDepth/2),  // back left bottom
        new THREE.Vector3(hallwayWidth/2, 0, -hallwayDepth/2),   // back right bottom
        new THREE.Vector3(hallwayWidth/2, 0, hallwayDepth/2),    // front right bottom
        new THREE.Vector3(-hallwayWidth/2, 0, hallwayDepth/2),   // front left bottom
        
        // Top corners  
        new THREE.Vector3(-hallwayWidth/2, wallHeight, -hallwayDepth/2),  // back left top
        new THREE.Vector3(hallwayWidth/2, wallHeight, -hallwayDepth/2),   // back right top
        new THREE.Vector3(hallwayWidth/2, wallHeight, hallwayDepth/2),    // front right top
        new THREE.Vector3(-hallwayWidth/2, wallHeight, hallwayDepth/2)   // front left top
    ];

    // Define the 12 edges (each edge connects two corners)
    const edges = [
        // Bottom face
        [0, 1], [1, 2], [2, 3], [3, 0],
        // Top face  
        [4, 5], [5, 6], [6, 7], [7, 4],
        // Vertical edges
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    // Create line segments for each edge using THREE.LineSegments for efficiency
    const points = [];
    
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        points.push(corners[edge[0]]);
        points.push(corners[edge[1]]);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: config.wireframeColor });
    const lines = new THREE.LineSegments(geometry, lineMaterial);
    scene.add(lines);

    // Add pillars at the configured positions
    const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
    const pillarMaterial = new THREE.MeshLambertMaterial({ color: config.wireframeColor, wireframe: true });
    
    for (let i = 0; i < config.pillarCount; i++) {
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.x = -4 + i * config.pillarSpacing;
        pillar.position.y = 2;
        pillar.position.z = -15;
        scene.add(pillar);
    }
}

// Handle keyboard input
function onKeyDown(event) {
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

function onKeyUp(event) {
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

// Handle mouse movement for looking around
function onMouseMove(event) {
    if (document.pointerLockElement !== renderer.domElement) {
        return;
    }

    const sensitivity = 0.002;
    const maxPitch = Math.PI / 2 - 0.01;

    // Horizontal rotation (yaw)
    camera.rotation.y -= event.movementX * sensitivity;

    // Vertical rotation (pitch)
    camera.rotation.x -= event.movementY * sensitivity;

    // Prevent looking too far up or down
    camera.rotation.x = Math.max(
        -maxPitch,
        Math.min(maxPitch, camera.rotation.x)
    );

    // Never allow sideways camera tilt
    camera.rotation.z = 0;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the game
function startGame() {
    startScreen.style.display = 'none';
    
    // Request pointer lock to enable mouse look
    renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock;
    renderer.domElement.requestPointerLock();
}

// Get level data from JSON file
function getLevelData(levelId) {
    // In a real implementation, this would fetch and parse the levels.json file
    // For now, we'll return hardcoded values that match what was in the JSON file
    const levels = [
        {
            id: 1,
            playerStart: { x: 0, y: 0, z: -4 },
            playerLookAt: { x: 0, y: 0, z: -1 },
            walls: [
                // Wall data would come from the JSON file
            ]
        }
    ];
    
    return levels.find(level => level.id === levelId) || null;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Apply gravity
    velocity.y -= config.gravity * delta; // Gravity

    // Movement controls with proper direction calculation and frame-rate independence
    if (moveForward || moveBackward || moveLeft || moveRight) {
        // Calculate movement direction based on camera rotation
        const direction = new THREE.Vector3();
        
        if (moveForward) direction.z -= 1;
        if (moveBackward) direction.z += 1;
        if (moveLeft) direction.x -= 1;
        if (moveRight) direction.x += 1;
        
        // Normalize the direction vector to prevent faster diagonal movement
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Rotate direction based on camera rotation
        direction.applyQuaternion(camera.quaternion);
        
        // Apply movement with proper speed - using delta for frame-rate independence
        velocity.x = direction.x * config.moveSpeed;
        velocity.z = direction.z * config.moveSpeed;
    }

    // Store previous position for collision detection
    const prevPosition = camera.position.clone();

    // Apply movement to camera position (using the original approach)
    camera.position.add(velocity);

    // Simple ground collision (keep player above floor)
    if (camera.position.y < config.cameraHeight) {
        velocity.y = 0;
        camera.position.y = config.cameraHeight;
        canJump = true;
    }

    // Slow down movement over time (friction) - using delta for frame-rate independence
    velocity.x *= Math.pow(config.friction, delta);
    velocity.z *= Math.pow(config.friction, delta);

    prevTime = time;

    renderer.render(scene, camera);
}

// Start the game
init();