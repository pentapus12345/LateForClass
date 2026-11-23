const STARTING_LEVEL_ID = 1;
const LEVELS_URL = 'assets/levels.json';
const HALLWAY_OBJECTIVE = 'Reach the far end of the hallway';
const MAX_FRAME_DELTA = 0.25;

class Game {
    constructor(config) {
        this.config = config;
        this.clock = new THREE.Clock();
        this.started = false;
        this.result = null;
        this.arrivedRoomId = null;
        this.pointerLockFailed = false;
        this.optionsOpen = false;
    }

    async init() {
        this.startScreen = document.getElementById('start-screen');
        this.screenTitle = document.getElementById('screen-title');
        this.screenMessage = document.getElementById('screen-message');
        this.startButton = document.getElementById('start-button');
        this.objective = document.getElementById('objective');
        this.schedulePanel = document.getElementById('schedule-panel');
        this.schoolTime = document.getElementById('school-time');
        this.viewStatus = document.getElementById('view-status');
        this.viewToggle = document.getElementById('view-toggle');
        this.optionsButton = document.getElementById('options-button');
        this.optionsScreen = document.getElementById('options-screen');
        this.controlForm = document.getElementById('control-form');
        this.controlSettings = loadControlSettings();
        const container = document.getElementById('game-container');

        const response = await fetch(LEVELS_URL);
        if (!response.ok) {
            throw new Error(`Failed to load levels.json: ${response.status}`);
        }
        const { levels } = await response.json();
        const requestedLevel = new URLSearchParams(window.location.search).get('level');
        const requestedLevelId = Number(requestedLevel || STARTING_LEVEL_ID);
        const levelDefinition = levels.find(level => level.id === requestedLevelId) ??
            levels.find(level => level.id === STARTING_LEVEL_ID);
        if (!levelDefinition) {
            throw new Error(`Level ${STARTING_LEVEL_ID} is missing`);
        }
        this.schoolClock = levelDefinition.clock
            ? new SchoolClock(levelDefinition.clock, levelDefinition.schedule?.startTime)
            : null;
        document.getElementById('school-clock').hidden = !this.schoolClock;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);
        this.scene.fog = new THREE.Fog(this.config.backgroundColor, this.config.fogNear, this.config.fogFar);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(1, 2, -1);
        this.scene.add(directionalLight);

        this.level = new Level(levelDefinition, this.config);
        this.populateSchedule(levelDefinition.schedule);
        this.syncControlForm();
        this.updateInstructions();
        this.player = new Player(this.config, this.controlSettings);
        this.resizeRenderer();
        this.restart();
        container.appendChild(this.renderer.domElement);

        this.startButton.addEventListener('click', () => this.start());
        this.viewToggle.addEventListener('click', () => this.toggleView());
        this.optionsButton.addEventListener('click', () => this.setOptionsOpen(true));
        document.getElementById('options-back').addEventListener('click', () => this.setOptionsOpen(false));
        document.getElementById('restore-controls').addEventListener('click', () => {
            this.applyControlSettings({ ...DEFAULT_CONTROL_SETTINGS });
        });
        this.controlForm.addEventListener('input', () => this.applyControlSettings(this.readControlForm()));
        document.addEventListener('keydown', event => this.onKeyDown(event));
        document.addEventListener('keyup', event => {
            this.player.releaseAction(getKeyboardAction(event.code, this.controlSettings.keyboardLayout));
        });
        document.addEventListener('mousemove', event => {
            if (this.isPlaying() && document.hasFocus()) {
                this.player.onMouseMove(event);
            }
        });
        this.renderer.domElement.addEventListener('mousedown', event => {
            if (event.button === 0 && this.controlSettings.clickToJump && this.isPlaying() && document.hasFocus()) {
                this.player.pressAction('jump');
            }
        });
        document.addEventListener('pointerlockchange', () => this.syncPlayState());
        document.addEventListener('visibilitychange', () => this.syncPlayState());
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        window.addEventListener('blur', () => this.syncPlayState());
        window.addEventListener('focus', () => this.syncPlayState());
        window.addEventListener('resize', () => {
            this.resizeRenderer();
            this.render();
        });

        this.startButton.disabled = false;
        this.optionsButton.disabled = false;
        this.animate();
    }

    start() {
        if (this.completed) {
            this.restart();
        }
        this.started = true;
        this.pointerLockFailed = false;
        this.updateInterface();

        try {
            const request = this.renderer.domElement.requestPointerLock();
            request?.catch(() => this.onPointerLockError());
        } catch {
            this.onPointerLockError();
        }
    }

    get completed() {
        return this.result !== null;
    }

    isPlaying() {
        return this.started && !this.completed && !this.optionsOpen && !document.hidden && document.hasFocus() &&
            document.pointerLockElement === this.renderer.domElement;
    }

    syncPlayState() {
        const now = performance.now();
        const isPlaying = this.isPlaying();
        const wasRunning = this.schoolClock?.isRunning;
        this.schoolClock?.setRunning(isPlaying, now);
        this.player.clearInput();
        this.clock.getDelta();
        if ((wasRunning || isPlaying) && this.checkDeadline(now)) {
            return;
        }
        this.updateInterface(now);
    }

    onPointerLockError() {
        this.pointerLockFailed = true;
        this.updateInterface();
    }

    restart() {
        this.level.build(this.scene);
        this.player.resetPosition(this.level.playerStart, this.level.playerLookAt, this.level);
        this.result = null;
        this.arrivedRoomId = null;
        this.pointerLockFailed = false;
        this.schoolClock?.reset();
        this.syncPlayState();
        this.render();
    }

    onKeyDown(event) {
        const action = getKeyboardAction(event.code, this.controlSettings.keyboardLayout);
        if (!action || !document.hasFocus()) {
            return;
        }
        const isPlaying = this.isPlaying();
        if (isPlaying) {
            event.preventDefault();
        }
        if (event.repeat) {
            return;
        }
        if (this.optionsOpen) {
            if (action === 'pause') {
                this.setOptionsOpen(false);
            }
            return;
        }

        if (action === 'restart') {
            if (this.started) {
                this.restart();
            }
            return;
        }
        if (action === 'toggleView') {
            this.toggleView();
            return;
        }
        if (!isPlaying) {
            return;
        }

        if (action === 'pause') {
            document.exitPointerLock();
            return;
        }
        if (action === 'interact') {
            if (this.level.openDoor(this.player.position)) {
                this.updateObjective();
                return;
            }
            if (this.level.canConfirmArrival(this.player.position)) {
                this.finishRun('arrived');
            }
            return;
        }

        this.player.pressAction(action);
    }

    checkDeadline(now) {
        if (this.schoolClock?.hasReachedDeadline(now)) {
            this.finishRun('late', null, now);
            return true;
        }
        return false;
    }

    finishRun(result, roomId = null, now = performance.now()) {
        this.result = result;
        this.arrivedRoomId = roomId;
        this.schoolClock?.setRunning(false, now);
        this.player.clearInput();
        this.updateInterface(now);
        if (document.pointerLockElement === this.renderer.domElement) {
            document.exitPointerLock();
        }
    }

    updateInterface(now = performance.now()) {
        const isPlaying = this.isPlaying();
        this.startScreen.hidden = isPlaying || this.optionsOpen;
        this.optionsScreen.hidden = !this.optionsOpen;
        this.schedulePanel.hidden = !isPlaying || !this.level.definition.schedule;
        this.updateSchoolTime(now);
        this.updateViewStatus();

        if (isPlaying) {
            this.updateObjective();
            return;
        }
        this.objective.hidden = true;

        if (this.result === 'late') {
            const { schedule } = this.level.definition;
            this.screenTitle.textContent = 'You’re Late!';
            this.screenMessage.textContent = `${schedule.className} started at ${schedule.startTime} in Room ${schedule.roomId}.`;
            this.startButton.textContent = 'Retry';
        } else if (this.completed) {
            this.screenTitle.textContent = 'You made it to class!';
            this.screenMessage.textContent = this.arrivedRoomId
                ? `You arrived at Room ${this.arrivedRoomId}.`
                : 'Level complete.';
            this.startButton.textContent = 'Play Again';
        } else if (this.started) {
            this.screenTitle.textContent = 'Paused';
            this.screenMessage.textContent = this.pointerLockFailed
                ? 'Could not capture the cursor. Click Resume to try again.'
                : 'Click Resume to continue.';
            this.startButton.textContent = 'Resume';
        } else {
            const { id, name, instructions } = this.level.definition;
            this.screenTitle.textContent = id === STARTING_LEVEL_ID ? 'Late For Class' : name;
            this.screenMessage.textContent = instructions ?? `${HALLWAY_OBJECTIVE}.`;
            this.startButton.textContent = 'Start Game';
        }
    }

    setOptionsOpen(open) {
        this.optionsOpen = open;
        this.syncPlayState();
        if (open) {
            this.controlForm.elements.namedItem('keyboardLayout').focus();
        } else {
            this.optionsButton.focus();
        }
    }

    readControlForm() {
        const settings = {};
        for (const [name, fallback] of Object.entries(DEFAULT_CONTROL_SETTINGS)) {
            const field = this.controlForm.elements.namedItem(name);
            if (typeof fallback === 'boolean') {
                settings[name] = field.checked;
            } else {
                settings[name] = typeof fallback === 'number' ? field.valueAsNumber : field.value;
            }
        }
        return normalizeControlSettings(settings);
    }

    syncControlForm() {
        for (const [name, value] of Object.entries(this.controlSettings)) {
            const field = this.controlForm.elements.namedItem(name);
            if (typeof value === 'boolean') {
                field.checked = value;
            } else {
                field.value = String(value);
            }
        }
        document.getElementById('keyboard-speed-value').textContent = `${this.controlSettings.keyboardLookSpeed}°/s`;
        document.getElementById('mouse-sensitivity-value').textContent = `${this.controlSettings.mouseSensitivity}×`;
    }

    applyControlSettings(settings) {
        this.controlSettings = settings;
        this.player.controlSettings = settings;
        this.player.clearInput();
        this.syncControlForm();
        this.updateInstructions();
        document.getElementById('options-status').hidden = saveControlSettings(settings);
    }

    updateInstructions() {
        const { keyboardLayout, keyboardLook, mouseLook, clickToJump } = this.controlSettings;
        const { moveLabel, lookLabel } = KEYBOARD_LAYOUTS[keyboardLayout];
        const instructions = [`${moveLabel} to move`];
        const lookInputs = [mouseLook && 'Mouse', keyboardLook && lookLabel].filter(Boolean);
        if (lookInputs.length) {
            instructions.push(`${lookInputs.join(' or ')} to look`);
        }
        instructions.push(clickToJump ? 'Space or left click to jump' : 'Space to jump');
        if (this.level.definition.door || this.level.definition.classroom) {
            instructions.push('E to interact');
        }
        if (this.level.definition.solidRendering) {
            instructions.push('V to switch views');
        }
        instructions.push('Escape to pause', 'R to restart');
        document.getElementById('instructions').textContent = instructions.join(' · ');
    }

    populateSchedule(schedule) {
        if (!schedule) {
            return;
        }

        document.getElementById('schedule-class-name').textContent = schedule.className;
        document.getElementById('schedule-room').textContent = `Room ${schedule.roomId}`;
        const startTime = document.getElementById('schedule-start-time');
        startTime.textContent = schedule.startTime;
        startTime.dateTime = schedule.startTime;
    }

    updateSchoolTime(now) {
        if (this.schoolClock) {
            const time = this.schoolClock.formatTime(now);
            if (this.schoolTime.textContent !== time) {
                this.schoolTime.textContent = time;
                this.schoolTime.dateTime = time;
            }
        }
    }

    toggleView() {
        if (this.level.toggleDebugView()) {
            this.updateViewStatus();
            this.render();
        }
    }

    updateViewStatus() {
        const supportsViewToggle = this.level.definition.solidRendering;
        this.viewStatus.hidden = !supportsViewToggle || !this.isPlaying();
        this.viewToggle.hidden = !supportsViewToggle;
        if (supportsViewToggle) {
            const label = this.level.debugView ? 'Return to solid view' : 'Show collision outlines';
            this.viewStatus.textContent = `V · ${label}`;
            this.viewToggle.textContent = label;
        }
    }

    updateObjective() {
        const { position } = this.player;
        const { classroom } = this.level.definition;
        const { destinationRoomId } = this.level;
        let instruction = '';
        if (this.level.canOpenDoor(position)) {
            instruction = 'Press E to open the door';
        } else if (destinationRoomId) {
            instruction = `Find Room ${destinationRoomId}`;
        } else if (classroom) {
            instruction = this.level.canConfirmArrival(position)
                ? 'Press E to enter the classroom'
                : HALLWAY_OBJECTIVE;
        }
        this.objective.hidden = !instruction;
        if (this.objective.textContent !== instruction) {
            this.objective.textContent = instruction;
        }
    }

    resizeRenderer() {
        const { innerWidth: width, innerHeight: height } = window;
        this.player.resizeCamera(width, height);
        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.player.camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = Math.min(this.clock.getDelta(), MAX_FRAME_DELTA);

        const now = performance.now();
        if (this.isPlaying() && !this.checkDeadline(now)) {
            this.player.update(deltaTime, this.level);
            const roomId = this.level.getEnteredRoomId(this.player.position);
            if (roomId !== null && roomId === this.level.destinationRoomId) {
                this.finishRun('arrived', roomId, now);
            } else {
                this.updateSchoolTime(now);
                this.updateObjective();
            }
            this.render();
        }
    }
}
