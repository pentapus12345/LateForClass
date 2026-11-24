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

function areaObjectKey(kind, item) {
    return item.id ?? (kind === 'door' ? item.roomId : null) ?? item.name ??
        // Legacy geometry may have no label. Coincident anonymous objects require explicit IDs.
        [item.x, item.y ?? 0, item.z].join(',');
}

function registerSchoolAreas(school) {
    const areas = new Map();
    const rooms = new Map();
    const regions = [];
    for (const { id, definition, neighbors = [] } of school.areas) {
        if (!id || areas.has(id)) {
            throw new Error(`Invalid or duplicate area ID: ${id}`);
        }
        areas.set(id, { definition, neighbors, doors: new Map(), status: 'unloaded' });
        for (const room of definition.classrooms ?? (definition.classroom ? [definition.classroom] : [])) {
            if (!room.id) {
                continue; // The legacy Hallway has a proximity objective.
            }
            if (rooms.has(room.id)) {
                throw new Error(`Duplicate room ID: ${room.id}`);
            }
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
    return { areas, rooms };
}
