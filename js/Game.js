const STARTING_LEVEL_ID = 1;
const LEVELS_URL = 'assets/levels.json';
const LEVEL_LOAD_TIMEOUT_MS = 10000;
const HALLWAY_OBJECTIVE = 'Reach the far end of the hallway';
const MAX_FRAME_DELTA = 0.25;

class Game {
    constructor(config, ui) {
        this.config = config;
        this.ui = ui;
        this.frameClock = new THREE.Clock();
        this.pointerLockFailed = false;
    }

    async init() {
        this.controlSettings = loadControlSettings();

        const response = await fetch(LEVELS_URL, {
            cache: 'no-cache',
            signal: AbortSignal.timeout(LEVEL_LOAD_TIMEOUT_MS)
        });
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
        this.session = new GameSession(levelDefinition);
        this.definition = levelDefinition;
        const school = schoolFromLevel(levelDefinition);
        this.world = new World(school, this.config, LEVELS_URL);
        await this.world.loadArea(school.initialAreaId);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);
        this.scene.fog = new THREE.Fog(this.config.backgroundColor, this.config.fogNear, this.config.fogFar);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.world.attach(this.scene, new LightingManager(this.scene, this.renderer));
        this.world.activateArea(school.initialAreaId);

        this.ui.configure({
            title: levelDefinition.id === STARTING_LEVEL_ID ? 'Late For Class' : levelDefinition.name,
            message: levelDefinition.instructions ?? `${HALLWAY_OBJECTIVE}.`,
            schedule: this.session.schedule,
            hasClock: this.session.hasClock,
            hasInteraction: Boolean(levelDefinition.doors?.length || levelDefinition.door) || Boolean(levelDefinition.classroom),
            supportsViewToggle: levelDefinition.solidRendering
        });
        this.ui.renderControls(this.controlSettings);
        this.player = new Player(this.config, this.controlSettings);
        this.resizeRenderer();
        this.resetRun();
        this.ui.mountCanvas(this.renderer.domElement);

        this.ui.bindActions({
            start: () => this.start(),
            toggleView: () => this.toggleView(),
            setOptionsOpen: open => this.setOptionsOpen(open),
            applyControls: settings => this.applyControlSettings(settings)
        });
        document.addEventListener('keydown', event => this.onKeyDown(event));
        document.addEventListener('keyup', event => {
            this.player.releaseAction(getKeyboardAction(event.code, this.controlSettings.keyboardLayout));
        });
        document.addEventListener('mousemove', event => {
            if (this.isPlaying()) {
                this.player.onMouseMove(event);
            }
        });
        this.renderer.domElement.addEventListener('mousedown', event => {
            if (event.button === 0 && this.controlSettings.clickToJump && this.isPlaying()) {
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

        window.addEventListener('pagehide', event => {
            if (!event.persisted) {
                this.dispose();
            }
        });
        this.ui.setEnabled(true);
        this.animate();
    }

    dispose() {
        this.world?.dispose();
        this.renderer?.dispose();
    }

    start() {
        if (this.session.isFinished) {
            this.restart();
        }
        this.session.start();
        this.pointerLockFailed = false;
        this.updateInterface();

        try {
            const request = this.renderer.domElement.requestPointerLock();
            request?.catch(() => this.onPointerLockError());
        } catch {
            this.onPointerLockError();
        }
    }

    hasPlayAccess() {
        return !this.ui.optionsOpen && !document.hidden && document.hasFocus() &&
            document.pointerLockElement === this.renderer.domElement;
    }

    isPlaying() {
        return this.session.isRunning && this.hasPlayAccess();
    }

    syncPlayState() {
        const now = performance.now();
        const finished = this.session.setPlayAccess(this.hasPlayAccess(), now);
        this.frameClock.getDelta();
        if (finished) {
            this.presentResult(now);
        } else {
            this.player.clearInput();
            this.updateInterface(now);
        }
    }

    onPointerLockError() {
        this.pointerLockFailed = true;
        this.updateInterface();
    }

    restart() {
        this.world.reset();
        this.resetRun();
    }

    resetRun() {
        this.player.resetPosition(this.definition.playerStart, this.definition.playerLookAt, this.world);
        this.session.reset();
        this.pointerLockFailed = false;
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
        if (this.ui.optionsOpen) {
            if (action === 'pause') {
                this.setOptionsOpen(false);
            }
            return;
        }

        if (action === 'restart') {
            if (this.session.phase !== 'ready') {
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
            if (this.world.openDoor(this.player.position)) {
                this.updateObjective();
                return;
            }
            const now = performance.now();
            if (this.world.canConfirmArrival(this.player.position) && this.session.confirmLegacyArrival(now)) {
                this.presentResult(now);
            }
            return;
        }

        this.player.pressAction(action);
    }

    presentResult(now) {
        this.player.clearInput();
        this.updateInterface(now);
        if (document.pointerLockElement === this.renderer.domElement) {
            document.exitPointerLock();
        }
    }

    updateInterface(now = performance.now()) {
        const running = this.session.isRunning;
        this.ui.renderSession(this.session.snapshot(now), this.pointerLockFailed);
        this.ui.renderView(this.world.debugView, running);
        if (running) {
            this.updateObjective();
        }
    }

    setOptionsOpen(open) {
        this.ui.optionsOpen = open;
        this.syncPlayState();
        this.ui.focusMenu();
    }

    applyControlSettings(settings) {
        this.controlSettings = settings;
        this.player.controlSettings = settings;
        this.player.clearInput();
        this.ui.renderControls(settings);
        this.ui.renderControlsStatus(saveControlSettings(settings));
    }

    toggleView() {
        if (this.world.toggleDebugView()) {
            this.ui.renderView(this.world.debugView, this.isPlaying());
            this.render();
        }
    }

    updateObjective() {
        const { position } = this.player;
        const { classroom } = this.definition;
        const { destinationRoomId } = this.session;
        let instruction = '';
        if (this.world.canOpenDoor(position)) {
            instruction = 'Press E to open the door';
        } else if (destinationRoomId) {
            instruction = `Find Room ${destinationRoomId}`;
        } else if (classroom) {
            instruction = this.world.canConfirmArrival(position)
                ? 'Press E to enter the classroom'
                : HALLWAY_OBJECTIVE;
        }
        this.ui.renderObjective(instruction);
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
        const deltaTime = Math.min(this.frameClock.getDelta(), MAX_FRAME_DELTA);

        const now = performance.now();
        if (!this.isPlaying()) {
            return;
        }
        // Timeout takes precedence over moving into a room on this frame.
        if (this.session.checkDeadline(now)) {
            this.presentResult(now);
            return;
        }
        this.player.update(deltaTime, this.world);
        const roomId = this.world.getEnteredRoomId(this.player.position);
        if (this.session.enterRoom(roomId, now)) {
            this.presentResult(now);
        } else {
            this.ui.renderSchoolTime(this.session.getSchoolTime(now));
            this.updateObjective();
        }
        this.render();
    }
}
