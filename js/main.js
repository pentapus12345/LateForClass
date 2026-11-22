(async () => {
    try {
        const game = new Game(GAME_CONFIG);
        await game.init();
    } catch (error) {
        console.error('Unable to start LateForClass', error);
        document.getElementById('screen-message').textContent =
            'Could not load the game. Check your connection and reload the page.';
    }
})();
