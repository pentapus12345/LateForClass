const PILLAR_RADIAL_SEGMENTS = 16;
const CONTACT_TOLERANCE = 1e-9;
const DEFAULT_SURFACE_COLOR = 0xb6c0c9;

class Level {
    constructor(definition, config, models = new Map()) {
        this.definition = definition;
        this.config = config;
        this.models = models;
        this.playerStart = definition.playerStart;
        this.playerLookAt = definition.playerLookAt;
        const { classroom, door } = definition;
        this.classrooms = (definition.classrooms ?? (classroom ? [classroom] : [])).map(room => ({
            ...room,
            bounds: room.bounds ? new Wall(room.bounds) : null
        }));
        this.doorDefinitions = definition.doors ?? (door ? [door] : []);
        this.solids = [];
        this.objects = [];
        this.renderPairs = [];
        this.debugView = false;
        this.doors = [];
    }

    async loadEnvironmentModels(levelsUrl, signal) {
        this.models = await EnvironmentObjectFactory.loadModels(this.definition.environmentObjects ?? [], levelsUrl, signal);
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
        for (const door of this.doorDefinitions) {
            this.addDoor(scene, door);
        }
        if (this.definition.environmentObjects?.length) {
            this.addEnvironmentObjects(scene);
        }
        for (const classroom of this.classrooms) {
            if (classroom.sign) {
                const label = `Room ${classroom.id}`;
                this.addSign(scene, { ...classroom.sign, name: label, lines: [label] });
            }
        }
        for (const sign of this.definition.signs ?? []) {
            this.addSign(scene, sign);
        }
    }

    addObject(scene, object) {
        scene.add(object);
        this.objects.push(object);
    }

    addEnvironmentObjects(scene) {
        const factory = new EnvironmentObjectFactory(this.models);
        for (const placement of this.definition.environmentObjects) {
            for (const { surface, bounds } of factory.create(placement)) {
                this.addObject(scene, surface);
                if (bounds) {
                    this.solids.push(bounds);
                    const outline = this.addWireframeBox(scene, bounds, undefined, `${surface.name} collision`);
                    if (this.definition.solidRendering) {
                        this.addRenderPair(surface, outline);
                    } else {
                        surface.visible = false;
                    }
                }
            }
        }
    }

    clear(scene) {
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        for (const object of this.objects) {
            scene.remove(object);
            // Model groups borrow their meshes from the level's model cache across builds.
            if (object.isGroup) {
                continue;
            }
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
        this.doors = [];
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

    addPlatformVisuals(scene, bounds, { color, name, surfaceColor = DEFAULT_SURFACE_COLOR,
        castShadow = false, receiveShadow = false }) {
        if (!this.definition.solidRendering) {
            this.addWireframeBox(scene, bounds, color, name);
            return;
        }

        const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
        const geometry = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ);
        const material = receiveShadow
            ? new THREE.MeshPhongMaterial({ color: surfaceColor, specular: 0x000000 })
            : new THREE.MeshLambertMaterial({ color: surfaceColor });
        const surface = new THREE.Mesh(geometry, material);
        surface.name = name;
        surface.castShadow = castShadow;
        surface.receiveShadow = receiveShadow;
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

    getEnteredRoomId(position) {
        // The player's full footprint must clear the doorway, and their body
        // must fit between this room's floor and ceiling.
        const { x, y, z } = position;
        const { playerRadius, playerHeight } = this.config;
        for (const { id, bounds } of this.classrooms) {
            if (!id || !bounds) {
                continue;
            }
            const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
            const inside = x - playerRadius >= minX - CONTACT_TOLERANCE &&
                x + playerRadius <= maxX + CONTACT_TOLERANCE &&
                y >= minY - CONTACT_TOLERANCE && y + playerHeight <= maxY + CONTACT_TOLERANCE &&
                z - playerRadius >= minZ - CONTACT_TOLERANCE &&
                z + playerRadius <= maxZ + CONTACT_TOLERANCE;
            if (inside) {
                const entrances = this.doors.filter(door => door.definition.roomId === id);
                if (!entrances.length || entrances.some(door => door.isOpen)) {
                    return id;
                }
            }
        }
        return null;
    }

    canConfirmArrival(position) {
        const classroom = this.definition.classroom;
        if (classroom?.bounds || classroom?.interactionRadius === undefined) {
            return false;
        }
        const distance = Math.hypot(position.x - classroom.x, position.z - classroom.z);
        return distance <= classroom.interactionRadius;
    }

    addSign(scene, { name, lines, x, y, z, rotationY = 180, width = 0.88, height = 0.33,
        backgroundColor = '#82d8ac' }) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = Math.round(canvas.width * height / width);
        const context = canvas.getContext('2d');
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#15202b';
        const lineHeight = canvas.height / (lines.length + 1);
        const fontSize = Math.min(76, Math.floor(lineHeight * 0.82));
        context.font = `bold ${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        for (const [index, line] of lines.entries()) {
            context.fillText(line, canvas.width / 2, (index + 1) * lineHeight, canvas.width - 32);
        }

        const geometry = new THREE.PlaneGeometry(width, height);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const plaque = new THREE.Mesh(geometry, material);
        plaque.name = name;
        plaque.position.set(x, y, z);
        plaque.rotation.y = rotationY * Math.PI / 180;
        this.addObject(scene, plaque);
    }

    addDoor(scene, definition) {
        const { x, z, width, height, depth, color, surfaceColor = color, name,
            castShadow = false, receiveShadow = false } = definition;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        let material;
        if (!this.definition.solidRendering) {
            material = new THREE.MeshBasicMaterial({ color, opacity: 0.65, transparent: true });
        } else if (receiveShadow) {
            material = new THREE.MeshPhongMaterial({ color: surfaceColor, specular: 0x000000 });
        } else {
            material = new THREE.MeshLambertMaterial({ color: surfaceColor });
        }
        const panel = new THREE.Mesh(geometry, material);
        panel.name = name;
        panel.castShadow = castShadow;
        panel.receiveShadow = receiveShadow;
        let wireframe = null;
        if (this.definition.solidRendering) {
            wireframe = this.addWireframeBox(scene, new Wall({ x: 0, y: -height / 2, z: 0, width, height, depth }),
                color, `${name} collision`);
            this.addRenderPair(panel, wireframe);
        }
        const door = { definition, panel, wireframe, solidIndex: this.solids.length, isOpen: false };
        this.doors.push(door);
        this.setDoorPose(door, x, z, definition.axis === 'x' ? Math.PI / 2 : 0);
        this.addObject(scene, panel);
    }

    getNearbyDoor(position) {
        let nearest = null;
        let nearestDistance = Infinity;
        for (const door of this.doors) {
            if (door.isOpen) {
                continue;
            }
            const { x, y, z, interactionRadius } = door.definition;
            const distance = Math.hypot(position.x - x, position.y - y, position.z - z);
            if (distance <= interactionRadius && distance < nearestDistance) {
                nearest = door;
                nearestDistance = distance;
            }
        }
        return nearest;
    }

    canOpenDoor(position) {
        return this.getNearbyDoor(position) !== null;
    }

    openDoor(position) {
        const door = this.getNearbyDoor(position);
        if (!door) {
            return false;
        }
        const { x, z, width, axis } = door.definition;
        const normalIsX = axis === 'x';
        const normalDistance = normalIsX ? position.x - x : position.z - z;
        const swing = normalDistance <= 0 ? 1 : -1;
        const halfWidth = width / 2;
        // Turn around the jamb at the negative end of the door's local width.
        const openX = normalIsX ? x + swing * halfWidth : x - halfWidth;
        const openZ = normalIsX ? z + halfWidth : z + swing * halfWidth;
        this.setDoorPose(door, openX, openZ, ((normalIsX ? 1 : 0) - swing) * Math.PI / 2);
        door.isOpen = true;
        return true;
    }

    setDoorPose(door, x, z, angle) {
        const { y, width, height, depth } = door.definition;
        door.panel.position.set(x, y + height / 2, z);
        door.panel.rotation.y = angle;
        if (door.wireframe) {
            door.wireframe.position.set(x, y + height / 2, z);
            door.wireframe.rotation.y = angle;
        }
        const widthAlongX = angle % Math.PI === 0;
        this.solids[door.solidIndex] = new Wall({
            x, y, z, width: widthAlongX ? width : depth, height, depth: widthAlongX ? depth : width
        });
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
