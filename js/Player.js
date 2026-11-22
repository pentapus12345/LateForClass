const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
const MOUSE_SENSITIVITY = 0.002;
const MAX_PITCH = Math.PI / 2 - 0.01;
const FULL_TURN = 2 * Math.PI;
const MAX_PHYSICS_STEP = 1 / 120;

class Player {
    constructor(config) {
        this.config = config;
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.yaw = 0;
        this.pitch = 0;
        this.updateCameraRotation();
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.pressedKeys = new Set();
        this.isGrounded = false;
    }

    resizeCamera(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    resetPosition(start, lookAt, level) {
        this.clearInput();
        this.velocity.y = 0;
        this.position.set(start.x, start.y, start.z);
        const { playerRadius, playerHeight } = this.config;
        const supportY = level.getVerticalCollision(this.position, start.y, playerRadius, playerHeight);
        this.isGrounded = supportY !== null;
        this.position.y = supportY ?? start.y;
        this.updateCameraPosition();

        this.yaw = 0;
        this.pitch = 0;
        if (lookAt) {
            const directionX = lookAt.x - this.camera.position.x;
            const directionY = lookAt.y - this.camera.position.y;
            const directionZ = lookAt.z - this.camera.position.z;
            const horizontalLength = Math.hypot(directionX, directionZ);
            // A vertical target has no horizontal heading. Use the default yaw.
            this.yaw = horizontalLength > 0 ? Math.atan2(-directionX, -directionZ) : 0;
            this.pitch = Math.atan2(directionY, horizontalLength);
        }
        this.updateCameraRotation();
    }

    updateCameraPosition() {
        this.camera.position.set(
            this.position.x,
            this.position.y + this.config.cameraHeight,
            this.position.z
        );
    }

    updateCameraRotation() {
        this.yaw %= FULL_TURN;
        this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch));
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }

    clearInput() {
        this.pressedKeys.clear();
        this.velocity.x = 0;
        this.velocity.z = 0;
    }

    onKeyDown(event) {
        if (MOVEMENT_KEYS.has(event.code)) {
            this.pressedKeys.add(event.code);
        } else if (event.code === 'Space' && !event.repeat && this.isGrounded) {
            const { gravity, jumpHeight } = this.config;
            this.velocity.y = Math.sqrt(2 * gravity * jumpHeight);
            this.isGrounded = false;
        }
    }

    onKeyUp(event) {
        this.pressedKeys.delete(event.code);
    }

    onMouseMove(event) {
        this.yaw -= event.movementX * MOUSE_SENSITIVITY;
        this.pitch -= event.movementY * MOUSE_SENSITIVITY;
        this.updateCameraRotation();
    }

    update(deltaTime, level) {
        if (deltaTime <= 0) {
            return;
        }

        const strafe = Number(this.pressedKeys.has('KeyD')) - Number(this.pressedKeys.has('KeyA'));
        const forward = Number(this.pressedKeys.has('KeyW')) - Number(this.pressedKeys.has('KeyS'));
        const inputLength = Math.hypot(strafe, forward);
        const hasMovementInput = this.pressedKeys.size > 0;
        if (inputLength > 0) {
            const speed = this.config.moveSpeed / inputLength;
            this.velocity.x = (strafe * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) * speed;
            this.velocity.z = (-strafe * Math.sin(this.yaw) - forward * Math.cos(this.yaw)) * speed;
        } else if (hasMovementInput) {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        const { x: desiredX, z: desiredZ } = this.velocity;
        // Interleave horizontal and vertical motion. Small steps preserve wall
        // sliding and resolve platform edges while entering or leaving a footprint.
        const distance = Math.hypot(desiredX, desiredZ) * deltaTime;
        const maxStepDistance = this.config.playerRadius / 2;
        const steps = Math.ceil(Math.max(deltaTime / MAX_PHYSICS_STEP, distance / maxStepDistance));
        const stepTime = deltaTime / steps;
        const friction = hasMovementInput ? 0 : Math.max(0, this.config.friction);
        const damping = Math.exp(-friction * stepTime);
        // Integrate the decaying velocity over the whole step.
        const movementTime = friction > 0 ? -Math.expm1(-friction * stepTime) / friction : stepTime;

        for (let step = 0; step < steps; step++) {
            if (hasMovementInput) {
                this.velocity.x = desiredX;
                this.velocity.z = desiredZ;
            }
            this.moveHorizontally(this.velocity.x * movementTime, this.velocity.z * movementTime, level);
            this.moveVertically(stepTime, level);
            this.velocity.x *= damping;
            this.velocity.z *= damping;
        }
        this.updateCameraPosition();
    }

    moveHorizontally(displacementX, displacementZ, level) {
        const { playerRadius, playerHeight } = this.config;
        const { x, z } = this.position;

        this.position.x += displacementX;
        if (displacementX && level.isBlocked(this.position, playerRadius, playerHeight)) {
            this.position.x = x;
            this.velocity.x = 0;
        }

        this.position.z += displacementZ;
        if (displacementZ && level.isBlocked(this.position, playerRadius, playerHeight)) {
            this.position.z = z;
            this.velocity.z = 0;
        }
    }

    moveVertically(stepTime, level) {
        const { gravity, playerRadius, playerHeight } = this.config;
        let fallTime = stepTime;

        if (this.velocity.y > 0) {
            // Sweep the ascent and descent separately so a step spanning the
            // apex still detects a ceiling reached before the player falls.
            const riseTime = Math.min(stepTime, this.velocity.y / gravity);
            const targetY = this.position.y + (this.velocity.y - gravity * riseTime / 2) * riseTime;
            const ceilingY = level.getVerticalCollision(this.position, targetY, playerRadius, playerHeight);
            this.isGrounded = false;

            if (ceilingY === null) {
                this.position.y = targetY;
                this.velocity.y = Math.max(0, this.velocity.y - gravity * riseTime);
                fallTime -= riseTime;
            } else {
                const riseDistance = Math.max(0, ceilingY - this.position.y);
                const impactSpeed = Math.sqrt(Math.max(0, this.velocity.y ** 2 - 2 * gravity * riseDistance));
                fallTime -= 2 * riseDistance / (this.velocity.y + impactSpeed);
                this.position.y = ceilingY;
                this.velocity.y = 0;
            }
        }

        if (fallTime > 0) {
            const targetY = this.position.y + (this.velocity.y - gravity * fallTime / 2) * fallTime;
            const floorY = level.getVerticalCollision(this.position, targetY, playerRadius, playerHeight);
            this.isGrounded = floorY !== null;
            this.position.y = floorY ?? targetY;
            this.velocity.y = this.isGrounded ? 0 : this.velocity.y - gravity * fallTime;
        }
    }
}
