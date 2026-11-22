const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
const MOUSE_SENSITIVITY = 0.002;
const MAX_PITCH = Math.PI / 2 - 0.01;

class Player {
    constructor(config) {
        this.config = config;
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.rotation.order = 'YXZ';
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.pressedKeys = new Set();
    }

    resizeCamera(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
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
        this.pressedKeys.clear();
        this.velocity.set(0, 0, 0);
    }

    onKeyDown(event) {
        if (MOVEMENT_KEYS.has(event.code)) {
            this.pressedKeys.add(event.code);
        }
    }

    onKeyUp(event) {
        this.pressedKeys.delete(event.code);
    }

    onMouseMove(event) {
        this.camera.rotation.y -= event.movementX * MOUSE_SENSITIVITY;
        this.camera.rotation.x = Math.max(
            -MAX_PITCH,
            Math.min(MAX_PITCH, this.camera.rotation.x - event.movementY * MOUSE_SENSITIVITY)
        );
        this.camera.rotation.z = 0;
    }

    update(deltaTime, level) {
        const strafe = Number(this.pressedKeys.has('KeyD')) - Number(this.pressedKeys.has('KeyA'));
        const forward = Number(this.pressedKeys.has('KeyW')) - Number(this.pressedKeys.has('KeyS'));
        const inputLength = Math.hypot(strafe, forward);
        let movementTime = deltaTime;
        let damping = 1;

        if (inputLength > 0) {
            const yaw = this.camera.rotation.y;
            const speed = this.config.moveSpeed / inputLength;
            this.velocity.x = (strafe * Math.cos(yaw) - forward * Math.sin(yaw)) * speed;
            this.velocity.z = (-strafe * Math.sin(yaw) - forward * Math.cos(yaw)) * speed;
        } else if (this.pressedKeys.size > 0) {
            this.velocity.x = 0;
            this.velocity.z = 0;
        } else if (this.config.friction > 0) {
            damping = Math.exp(-this.config.friction * deltaTime);
            // Integrate the decaying velocity over the whole step.
            movementTime = -Math.expm1(-this.config.friction * deltaTime) / this.config.friction;
        }

        this.position.y += (this.velocity.y - this.config.gravity * deltaTime / 2) * deltaTime;
        this.velocity.y -= this.config.gravity * deltaTime;
        const groundHeight = level.getGroundHeight();
        if (this.position.y <= groundHeight) {
            this.position.y = groundHeight;
            this.velocity.y = 0;
        }

        this.moveHorizontally(this.velocity.x * movementTime, this.velocity.z * movementTime, level);
        this.velocity.x *= damping;
        this.velocity.z *= damping;
        this.updateCameraPosition();
    }

    moveHorizontally(displacementX, displacementZ, level) {
        if (displacementX === 0 && displacementZ === 0) {
            return;
        }

        const { playerRadius, playerHeight } = this.config;
        // Small steps prevent passing through thin walls. Resolving each axis
        // separately lets the player slide along a wall.
        const steps = Math.ceil(Math.hypot(displacementX, displacementZ) / (playerRadius / 2));
        let stepX = displacementX / steps;
        let stepZ = displacementZ / steps;

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
