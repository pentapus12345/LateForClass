const PILLAR_RADIAL_SEGMENTS = 16;
const CONTACT_TOLERANCE = 1e-9;

class Level {
    constructor(definition, config) {
        this.definition = definition;
        this.config = config;
        this.playerStart = definition.playerStart;
        this.playerLookAt = definition.playerLookAt;
        this.solids = [];
        this.objects = [];
        this.door = null;
    }

    build(scene) {
        this.clear(scene);
        if (this.definition.hallway) {
            this.createHallway(scene);
            this.createHallwayColliders();
        }
        for (const platform of this.definition.platforms ?? []) {
            const solid = new Wall(platform);
            this.solids.push(solid);
            this.addWireframeBox(scene, solid, platform.color, platform.name);
        }

        if (this.definition.pillars) {
            this.addPillars(scene);
        }
        if (this.definition.door) {
            this.addDoor(scene, this.definition.door);
        }
    }

    addObject(scene, object) {
        scene.add(object);
        this.objects.push(object);
    }

    clear(scene) {
        const geometries = new Set();
        const materials = new Set();
        for (const object of this.objects) {
            scene.remove(object);
            geometries.add(object.geometry);
            materials.add(object.material);
        }
        for (const geometry of geometries) {
            geometry.dispose();
        }
        for (const material of materials) {
            material.dispose();
        }
        this.objects = [];
        this.solids = [];
        this.door = null;
    }

    createHallway(scene) {
        const { width, height, depth } = this.definition.hallway;
        this.addWireframeBox(scene, {
            minX: -width / 2, maxX: width / 2, minY: 0, maxY: height, minZ: -depth / 2, maxZ: depth / 2
        });
    }

    addWireframeBox(scene, bounds, color = this.config.wireframeColor, name = '') {
        const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
        const corners = [
            [minX, minY, minZ], [maxX, minY, minZ], [maxX, minY, maxZ], [minX, minY, maxZ],
            [minX, maxY, minZ], [maxX, maxY, minZ], [maxX, maxY, maxZ], [minX, maxY, maxZ]
        ].map(point => new THREE.Vector3(...point));
        // Bottom edges, top edges, then the vertical edges.
        const edges = [
            0, 1, 1, 2, 2, 3, 3, 0,
            4, 5, 5, 6, 6, 7, 7, 4,
            0, 4, 1, 5, 2, 6, 3, 7
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(edges.map(index => corners[index]));
        const material = new THREE.LineBasicMaterial({ color });
        const frame = new THREE.LineSegments(geometry, material);
        frame.name = name;
        this.addObject(scene, frame);
    }

    createHallwayColliders() {
        const { width, height, depth, wallThickness } = this.definition.hallway;
        this.solids = [
            new Wall({ x: -width / 2, z: 0, width: wallThickness, height, depth }),
            new Wall({ x: width / 2, z: 0, width: wallThickness, height, depth }),
            new Wall({ x: 0, z: -depth / 2, width, height, depth: wallThickness }),
            new Wall({ x: 0, z: depth / 2, width, height, depth: wallThickness })
        ];
    }

    addPillars(scene) {
        const { startX, z, count, spacing, radius, height } = this.definition.pillars;
        const geometry = new THREE.CylinderGeometry(radius, radius, height, PILLAR_RADIAL_SEGMENTS);
        const material = new THREE.MeshLambertMaterial({ color: this.config.wireframeColor, wireframe: true });

        for (let index = 0; index < count; index++) {
            const pillar = new THREE.Mesh(geometry, material);
            pillar.position.set(startX + index * spacing, height / 2, z);
            this.addObject(scene, pillar);
        }
    }

    canEnterClassroom(position) {
        const classroom = this.definition.classroom;
        if (!classroom) {
            return false;
        }
        const distance = Math.hypot(position.x - classroom.x, position.z - classroom.z);
        return distance <= classroom.interactionRadius;
    }

    addDoor(scene, definition) {
        const { x, y, z, width, height, depth, color, name } = definition;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ color, opacity: 0.65, transparent: true });
        const panel = new THREE.Mesh(geometry, material);
        panel.name = name;
        panel.position.set(x, y + height / 2, z);
        this.door = { panel, solidIndex: this.solids.length, isOpen: false };
        this.solids.push(new Wall(definition));
        this.addObject(scene, panel);
    }

    canOpenDoor(position) {
        if (!this.door || this.door.isOpen) {
            return false;
        }
        const { x, y, z, interactionRadius } = this.definition.door;
        return Math.hypot(position.x - x, position.y - y, position.z - z) <= interactionRadius;
    }

    openDoor(position) {
        if (!this.canOpenDoor(position)) {
            return false;
        }
        const { x, y, z, width, height, depth } = this.definition.door;
        // Swing around the left jamb, away from the player.
        const swing = position.z <= z ? 1 : -1;
        const openX = x - width / 2;
        const openZ = z + swing * width / 2;
        this.door.panel.position.set(openX, y + height / 2, openZ);
        this.door.panel.rotation.y = -swing * Math.PI / 2;
        this.solids[this.door.solidIndex] = new Wall({
            x: openX, y, z: openZ, width: depth, height, depth: width
        });
        this.door.isOpen = true;
        return true;
    }

    isBlocked(position, radius, height) {
        return this.solids.some(solid => solid.checkCollision(position, radius, height));
    }

    getStepHeight(position, radius, height, maxStepHeight) {
        let stepY = position.y;
        for (const solid of this.solids) {
            if (solid.checkCollision(position, radius, height)) {
                stepY = Math.max(stepY, solid.maxY);
            }
        }
        return stepY > position.y && stepY - position.y <= maxStepHeight + CONTACT_TOLERANCE ? stepY : null;
    }

    // Return the first contact as a feet height. A stationary query checks support.
    getVerticalCollision(position, targetY, radius, height) {
        const rising = targetY > position.y;
        const hallway = this.definition.hallway;
        const boundary = hallway ? (rising ? hallway.height - height : 0) : null;
        const crossesFace = face => rising
            ? position.y <= face + CONTACT_TOLERANCE && targetY >= face
            : position.y >= face - CONTACT_TOLERANCE && targetY <= face + CONTACT_TOLERANCE;
        const nearestFace = rising ? Math.min : Math.max;
        let contactY = boundary !== null && crossesFace(boundary) ? boundary : null;

        for (const solid of this.solids) {
            const face = rising ? solid.minY - height : solid.maxY;
            if (crossesFace(face) && solid.overlapsFootprint(position, radius)) {
                contactY = contactY === null ? face : nearestFace(contactY, face);
            }
        }
        return contactY;
    }
}
