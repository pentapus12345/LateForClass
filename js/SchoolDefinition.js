// Existing levels are independent schools with one initial area in world coordinates.
function schoolFromLevel(definition) {
    const { lighting } = definition;
    const lights = lighting?.lights ?? DEFAULT_LEVEL_LIGHTS;
    const isGlobal = light => !lighting?.lights || ['ambient', 'hemisphere'].includes(light.type);
    const id = `level-${definition.id}`;
    const localLighting = {
        lights: lights.filter(light => !isGlobal(light)),
        fixtures: lighting?.fixtures
    };
    return {
        initialAreaId: id,
        globalLighting: { lights: lights.filter(isGlobal) },
        areas: [{ id, definition: { ...definition, lighting: localLighting } }]
    };
}

function areaRooms(definition) {
    return definition.rooms ?? definition.classrooms ?? (definition.classroom ? [definition.classroom] : []);
}

// One connection owns its aperture. Both endpoints use the same world-space survey.
function schoolFromManifest(manifest) {
    const { initialAreaId, initialActiveAreaIds, globalLighting, modelCatalog, doorProfiles } = manifest;
    const areas = manifest.areas.map(({ id, definition }) => ({
        id, neighbors: [], definition: { solidRendering: true, modelCatalog, doorProfiles, ...definition }
    }));
    const byId = new Map(areas.map(area => [area.id, area]));
    for (const { from, to, aperture } of manifest.connections) {
        const a = byId.get(from);
        const b = byId.get(to);
        if (!a || !b || a === b || a.neighbors.includes(to) ||
            !['x', 'z'].includes(aperture?.axis) ||
            ![aperture.plane, aperture.min, aperture.max, aperture.floor, aperture.ceiling].every(Number.isFinite) ||
            aperture.min >= aperture.max || aperture.floor >= aperture.ceiling) {
            throw new Error(`Invalid school connection: ${from} to ${to}`);
        }
        a.neighbors.push(to);
        b.neighbors.push(from);
    }
    if (!initialActiveAreaIds.includes(initialAreaId) || initialActiveAreaIds.some(id => !byId.has(id)) ||
        new Set(initialActiveAreaIds).size !== initialActiveAreaIds.length) {
        throw new Error('Invalid school startup areas');
    }
    const reachable = new Set([initialAreaId]);
    for (const id of reachable) {
        for (const neighbor of byId.get(id).neighbors) {
            reachable.add(neighbor);
        }
    }
    const destination = manifest.challenge.schedule.roomId;
    if (!areas.some(area => reachable.has(area.id) && areaRooms(area.definition).some(room =>
        room.id === destination && (!area.definition.rooms || room.kind === 'classroom') && room.bounds &&
        area.definition.doors?.some(door => door.roomId === room.id)))) {
        throw new Error(`Unreachable scheduled room: ${destination}`);
    }
    return { initialAreaId, initialActiveAreaIds, areas, globalLighting };
}

function areaObjectKey(kind, item) {
    return item.id ?? (kind === 'door' ? item.roomId : null) ?? item.name ??
        // Legacy geometry may have no label. Coincident anonymous objects require explicit IDs.
        [item.x, item.y ?? 0, item.z].join(',');
}

function registerSchoolAreas(school) {
    const areas = new Map();
    const rooms = new Map();
    const regions = [];
    const roomNumbers = new Map();
    const usedNumbers = new Set();
    for (const { id, definition, neighbors = [] } of school.areas) {
        if (!id || areas.has(id)) {
            throw new Error(`Invalid or duplicate area ID: ${id}`);
        }
        areas.set(id, { definition, neighbors, doors: new Map(), status: 'unloaded' });
        for (const room of areaRooms(definition)) {
            if (definition.rooms && (!room.id || typeof room.number !== 'string' || !room.number.trim())) {
                throw new Error('Numbered school rooms require an ID and public number');
            }
            if (!room.id) {
                continue; // The legacy Hallway has a proximity objective.
            }
            if (rooms.has(room.id)) {
                throw new Error(`Duplicate room ID: ${room.id}`);
            }
            const number = room.number ?? room.id;
            if (usedNumbers.has(number)) {
                throw new Error(`Duplicate room number: ${number}`);
            }
            usedNumbers.add(number);
            roomNumbers.set(room.id, number);
            rooms.set(room.id, id);
            if (room.bounds) {
                const box = new Wall(room.bounds);
                if (regions.some(other => ['X', 'Y', 'Z'].every(axis =>
                    box['min' + axis] < other['max' + axis] && box['max' + axis] > other['min' + axis]))) {
                    throw new Error(`Overlapping room bounds: ${room.id}`);
                }
                regions.push(box);
            }
        }
        for (const [kind, entries] of [
            ['platform', definition.platforms], ['placement', definition.environmentObjects],
            ['sign', definition.signs], ['door', definition.doors ?? (definition.door ? [definition.door] : [])]
        ]) {
            const keys = new Set();
            for (const item of entries ?? []) {
                const key = areaObjectKey(kind, item);
                if (!key || keys.has(key)) {
                    throw new Error(`Missing or duplicate ${kind} key in ${id}: ${key}`);
                }
                keys.add(key);
            }
        }
    }
    for (const id of [school.initialAreaId, ...school.areas.flatMap(area => area.neighbors ?? [])]) {
        if (!areas.has(id)) {
            throw new Error(`Unknown area: ${id}`);
        }
    }
    return { areas, rooms, roomNumbers };
}
