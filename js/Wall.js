class Wall {
    constructor({ x, y = 0, z, width, height, depth }) {
        this.minX = x - width / 2;
        this.maxX = x + width / 2;
        this.minY = y;
        this.maxY = y + height;
        this.minZ = z - depth / 2;
        this.maxZ = z + depth / 2;
    }

    checkCollision(position, radius, height) {
        if (position.y >= this.maxY || position.y <= this.minY - height) {
            return false;
        }

        return this.overlapsFootprint(position, radius);
    }

    overlapsFootprint(position, radius) {
        const closestX = Math.max(this.minX, Math.min(position.x, this.maxX));
        const closestZ = Math.max(this.minZ, Math.min(position.z, this.maxZ));
        return Math.hypot(position.x - closestX, position.z - closestZ) < radius;
    }
}
