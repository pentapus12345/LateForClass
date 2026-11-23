(async () => {
    let ui;
    try {
        ui = new GameUI(document);
        const game = new Game(GAME_CONFIG, ui);
        await game.init();
    } catch (error) {
        console.error('Unable to start LateForClass', error);
        const message = 'Could not load the game. Reload the page to try again.';
        if (ui) {
            ui.showLoadError(message);
        } else {
            document.getElementById('screen-message').textContent = message;
        }
    }
})();
