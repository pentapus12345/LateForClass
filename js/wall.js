class Wall {
    constructor({ x, y = 0, z, width, height, depth }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width;
        this.height = height;
        this.depth = depth;

        this.minX = x - width / 2;
        this.maxX = x + width / 2;
        this.minZ = z - depth / 2;
        this.maxZ = z + depth / 2;
    }

    render(scene) {
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshLambertMaterial({ color: 0x607289 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.x, this.y + this.height / 2, this.z);
        scene.add(mesh);
        return mesh;
    }

    checkCollision(position, radius, height) {
        if (position.y >= this.y + this.height || position.y + height <= this.y) {
            return false;
        }

        const closestX = Math.max(this.minX, Math.min(position.x, this.maxX));
        const closestZ = Math.max(this.minZ, Math.min(position.z, this.maxZ));
        return Math.hypot(position.x - closestX, position.z - closestZ) < radius;
    }
}
