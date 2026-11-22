const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);

class Player {
    constructor(camera, config) {
        this.config = config;
        this.camera = camera;
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.keys = new Set();
    }

    resetPosition(start, lookAt) {
        this.clearInput();
        this.position.set(start.x, start.y, start.z);
        this.updateCameraPosition();

        if (lookAt) {
            this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
        } else {
            this.camera.rotation.set(0, 0, 0);
        }
    }

    updateCameraPosition() {
        this.camera.position.set(
            this.position.x,
            this.position.y + this.config.cameraHeight,
            this.position.z
        );
    }

    clearInput() {
        this.keys.clear();
        this.velocity.set(0, 0, 0);
    }

    onKeyDown(event) {
        if (movementKeys.has(event.code)) {
            this.keys.add(event.code);
        }
    }

    onKeyUp(event) {
        this.keys.delete(event.code);
    }

    onMouseMove(event) {
        const sensitivity = 0.002;
        const maxPitch = Math.PI / 2 - 0.01;
        this.camera.rotation.y -= event.movementX * sensitivity;
        this.camera.rotation.x = Math.max(
            -maxPitch,
            Math.min(maxPitch, this.camera.rotation.x - event.movementY * sensitivity)
        );
        this.camera.rotation.z = 0;
    }

    update(delta, level) {
        const strafe = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
        const forward = Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'));
        const inputLength = Math.hypot(strafe, forward);
        let movementTime = delta;
        let damping = 1;

        if (inputLength > 0) {
            const yaw = this.camera.rotation.y;
            const speed = this.config.moveSpeed / inputLength;
            this.velocity.x = (strafe * Math.cos(yaw) - forward * Math.sin(yaw)) * speed;
            this.velocity.z = (-strafe * Math.sin(yaw) - forward * Math.cos(yaw)) * speed;
        } else if (this.keys.size > 0) {
            this.velocity.x = 0;
            this.velocity.z = 0;
        } else if (this.config.friction > 0) {
            damping = Math.exp(-this.config.friction * delta);
            // Integrate the decaying velocity over the whole step.
            movementTime = -Math.expm1(-this.config.friction * delta) / this.config.friction;
        }

        this.position.y += (this.velocity.y - this.config.gravity * delta / 2) * delta;
        this.velocity.y -= this.config.gravity * delta;
        const groundHeight = level.getGroundHeight(this.position.x, this.position.z);
        if (this.position.y <= groundHeight) {
            this.position.y = groundHeight;
            this.velocity.y = 0;
        }

        this.moveHorizontally(this.velocity.x * movementTime, this.velocity.z * movementTime, level);
        this.velocity.x *= damping;
        this.velocity.z *= damping;
        this.updateCameraPosition();
    }

    moveHorizontally(dx, dz, level) {
        if (dx === 0 && dz === 0) return;

        const { playerRadius, playerHeight } = this.config;
        // Small steps prevent passing through thin walls. Resolving each axis
        // separately lets the player slide along a wall.
        const steps = Math.ceil(Math.hypot(dx, dz) / (playerRadius / 2));
        let stepX = dx / steps;
        let stepZ = dz / steps;

        for (let step = 0; step < steps; step++) {
            const previousX = this.position.x;
            const previousZ = this.position.z;

            this.position.x += stepX;
            if (stepX && level.isBlocked(this.position, playerRadius, playerHeight)) {
                this.position.x = previousX;
                this.velocity.x = 0;
                stepX = 0;
            }

            this.position.z += stepZ;
            if (stepZ && level.isBlocked(this.position, playerRadius, playerHeight)) {
                this.position.z = previousZ;
                this.velocity.z = 0;
                stepZ = 0;
            }
        }
    }
}
