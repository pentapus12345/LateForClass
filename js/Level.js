const PILLAR_RADIAL_SEGMENTS = 16;
const CONTACT_TOLERANCE = 1e-9;
const DEFAULT_SURFACE_COLOR = 0xb6c0c9;

class Level {
    constructor(definition, config) {
        this.definition = definition;
        this.config = config;
        this.playerStart = definition.playerStart;
        this.playerLookAt = definition.playerLookAt;
        this.solids = [];
        this.objects = [];
        this.renderPairs = [];
        this.debugView = false;
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
            this.addPlatformVisuals(scene, solid, platform);
        }

        if (this.definition.pillars) {
            this.addPillars(scene);
        }
        if (this.definition.door) {
            this.addDoor(scene, this.definition.door);
        }
        if (this.definition.classroom?.zone) {
            this.addClassroomMarker(scene, this.definition.classroom.zone);
        }
        if (this.definition.classroom?.sign) {
            this.addClassroomSign(scene, this.definition.classroom);
        }
    }

    addObject(scene, object) {
        scene.add(object);
        this.objects.push(object);
    }

    clear(scene) {
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        for (const object of this.objects) {
            scene.remove(object);
            geometries.add(object.geometry);
            materials.add(object.material);
            if (object.material.map) {
                textures.add(object.material.map);
            }
        }
        for (const geometry of geometries) {
            geometry.dispose();
        }
        for (const material of materials) {
            material.dispose();
        }
        for (const texture of textures) {
            texture.dispose();
        }
        this.objects = [];
        this.solids = [];
        this.renderPairs = [];
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
        return frame;
    }

    addPlatformVisuals(scene, bounds, { color, name, surfaceColor = DEFAULT_SURFACE_COLOR }) {
        if (!this.definition.solidRendering) {
            this.addWireframeBox(scene, bounds, color, name);
            return;
        }

        const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
        const geometry = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ);
        const material = new THREE.MeshLambertMaterial({ color: surfaceColor });
        const surface = new THREE.Mesh(geometry, material);
        surface.name = name;
        surface.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
        this.addObject(scene, surface);
        const wireframe = this.addWireframeBox(scene, bounds, color, `${name} collision`);
        this.addRenderPair(surface, wireframe);
    }

    addRenderPair(surface, wireframe) {
        surface.visible = !this.debugView;
        wireframe.visible = this.debugView;
        this.renderPairs.push({ surface, wireframe });
    }

    toggleDebugView() {
        if (!this.definition.solidRendering) {
            return false;
        }

        this.debugView = !this.debugView;
        for (const { surface, wireframe } of this.renderPairs) {
            surface.visible = !this.debugView;
            wireframe.visible = this.debugView;
        }
        return true;
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
        if (classroom.zone) {
            const { x, y, z, width, depth } = classroom.zone;
            return classroom.id === this.definition.destinationRoomId &&
                Math.abs(position.y - y) <= CONTACT_TOLERANCE &&
                Math.abs(position.x - x) <= width / 2 &&
                Math.abs(position.z - z) <= depth / 2;
        }
        const distance = Math.hypot(position.x - classroom.x, position.z - classroom.z);
        return distance <= classroom.interactionRadius;
    }

    addClassroomMarker(scene, { x, y, z, width, depth, color }) {
        // Offset the outline slightly above the floor. It has no collider.
        const minY = y + 0.02;
        this.addWireframeBox(scene, {
            minX: x - width / 2, maxX: x + width / 2,
            minY, maxY: minY + 0.04,
            minZ: z - depth / 2, maxZ: z + depth / 2
        }, color, 'Classroom destination');
    }

    addClassroomSign(scene, { id, sign }) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 192;
        const context = canvas.getContext('2d');
        context.fillStyle = '#82d8ac';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#15202b';
        context.font = 'bold 76px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const label = `Room ${id}`;
        context.fillText(label, canvas.width / 2, canvas.height / 2, canvas.width - 32);

        const geometry = new THREE.PlaneGeometry(0.88, 0.33);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const plaque = new THREE.Mesh(geometry, material);
        plaque.name = label;
        plaque.position.set(sign.x, sign.y, sign.z);
        // Plane geometry faces +Z by default. The corridor is on the -Z side.
        plaque.rotation.y = Math.PI;
        this.addObject(scene, plaque);
    }

    addDoor(scene, definition) {
        const { x, y, z, width, height, depth, color, name } = definition;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = this.definition.solidRendering
            ? new THREE.MeshLambertMaterial({ color })
            : new THREE.MeshBasicMaterial({ color, opacity: 0.65, transparent: true });
        const panel = new THREE.Mesh(geometry, material);
        panel.name = name;
        panel.position.set(x, y + height / 2, z);
        let wireframe = null;
        if (this.definition.solidRendering) {
            wireframe = this.addWireframeBox(scene, new Wall({ x: 0, y: -height / 2, z: 0, width, height, depth }),
                color, `${name} collision`);
            wireframe.position.set(x, y + height / 2, z);
            this.addRenderPair(panel, wireframe);
        }
        this.door = { panel, wireframe, solidIndex: this.solids.length, isOpen: false };
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
        if (this.door.wireframe) {
            this.door.wireframe.position.set(openX, y + height / 2, openZ);
            this.door.wireframe.rotation.y = this.door.panel.rotation.y;
        }
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
