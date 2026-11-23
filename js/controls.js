const CONTROL_SETTINGS_KEY = 'lateForClass.controls';
const DEFAULT_CONTROL_SETTINGS = Object.freeze({
    keyboardLayout: 'standard',
    keyboardLook: true,
    keyboardLookSpeed: 120,
    mouseLook: true,
    mouseSensitivity: 1,
    invertMouseY: false,
    clickToJump: false
});
const CONTROL_RANGES = {
    keyboardLookSpeed: { min: 30, max: 270, step: 15 },
    mouseSensitivity: { min: 0.25, max: 4, step: 0.25 }
};

const KEYBOARD_LAYOUTS = {
    standard: {
        moveLabel: 'WASD',
        lookLabel: 'Arrow keys',
        actions: new Map([
            ['KeyW', 'moveForward'], ['KeyS', 'moveBack'], ['KeyA', 'moveLeft'], ['KeyD', 'moveRight'],
            ['ArrowUp', 'lookUp'], ['ArrowDown', 'lookDown'], ['ArrowLeft', 'lookLeft'], ['ArrowRight', 'lookRight']
        ])
    },
    swapped: {
        moveLabel: 'Arrow keys',
        lookLabel: 'WASD',
        actions: new Map([
            ['ArrowUp', 'moveForward'], ['ArrowDown', 'moveBack'], ['ArrowLeft', 'moveLeft'], ['ArrowRight', 'moveRight'],
            ['KeyW', 'lookUp'], ['KeyS', 'lookDown'], ['KeyA', 'lookLeft'], ['KeyD', 'lookRight']
        ])
    }
};
const FIXED_KEY_ACTIONS = new Map([
    ['Space', 'jump'], ['KeyE', 'interact'], ['Escape', 'pause'], ['KeyR', 'restart'], ['KeyV', 'toggleView']
]);

function getKeyboardAction(code, layout) {
    return FIXED_KEY_ACTIONS.get(code) ?? KEYBOARD_LAYOUTS[layout].actions.get(code);
}

function normalizeControlSettings(settings) {
    const normalized = { ...DEFAULT_CONTROL_SETTINGS };
    for (const [name, fallback] of Object.entries(DEFAULT_CONTROL_SETTINGS)) {
        const value = settings?.[name];
        if (typeof fallback === 'boolean' && typeof value === 'boolean') {
            normalized[name] = value;
        } else if (name === 'keyboardLayout' && typeof value === 'string' && Object.hasOwn(KEYBOARD_LAYOUTS, value)) {
            normalized[name] = value;
        } else if (Number.isFinite(value) && Object.hasOwn(CONTROL_RANGES, name)) {
            const { min, max, step } = CONTROL_RANGES[name];
            const clamped = Math.max(min, Math.min(max, value));
            normalized[name] = min + Math.round((clamped - min) / step) * step;
        }
    }
    return normalized;
}

function loadControlSettings() {
    try {
        return normalizeControlSettings(JSON.parse(window.localStorage.getItem(CONTROL_SETTINGS_KEY)));
    } catch {
        return { ...DEFAULT_CONTROL_SETTINGS };
    }
}

function saveControlSettings(settings) {
    try {
        window.localStorage.setItem(CONTROL_SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch {
        return false;
    }
}
