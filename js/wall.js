class Wall {
    constructor(x1, z1, x2, z2, height = 5) {
        this.x1 = x1;
        this.z1 = z1;
        this.x2 = x2;
        this.z2 = z2;
        this.height = height;
        
        // Calculate wall dimensions
        this.width = Math.abs(x2 - x1);
        this.depth = Math.abs(z2 - z1);
        this.centerX = (x1 + x2) / 2;
        this.centerZ = (z1 + z2) / 2;
    }
    
    render(scene) {
        // Create a solid rectangle instead of wireframe lines
        const wallGeometry = new THREE.PlaneGeometry(this.width, this.height);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513, // Brown color (saddle brown)
            side: THREE.DoubleSide
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        
        // Position the wall correctly
        wall.position.x = this.centerX;
        wall.position.y = this.height / 2;
        wall.position.z = this.centerZ;
        
        // Rotate to align with the wall orientation
        if (this.x1 !== this.x2) {
            wall.rotation.y = Math.PI / 2;
        }
        
        scene.add(wall);
        console.log("Wall rendered at position:", wall.position);
    }
    
    // More accurate collision detection with player
    checkCollision(playerPosition) {
        // Create a bounding box for the wall
        const minX = Math.min(this.x1, this.x2);
        const maxX = Math.max(this.x1, this.x2);
        const minZ = Math.min(this.z1, this.z2);
        const maxZ = Math.max(this.z1, this.z2);
        
        // Check if player position is within the wall's bounds
        const collision = (playerPosition.x >= minX && playerPosition.x <= maxX && 
                playerPosition.z >= minZ && playerPosition.z <= maxZ);
                
        console.log("Wall collision check:", {
            player: playerPosition,
            wallBounds: { minX, maxX, minZ, maxZ },
            collision
        });
        
        return collision;
    }
}

// Make Wall class globally available (for non-module environments)
if (typeof window !== 'undefined' && typeof window.Wall === 'undefined') {
    window.Wall = Wall;
}