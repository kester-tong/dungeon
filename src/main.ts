import { Game } from './game.js'; // Note the .js extension for browser ES modules

window.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new Game('gameCanvas');
        game.start();
    } catch (error) {
        console.error("Failed to initialize or start the game:", error);
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif;">
                <h1>Error loading game</h1>
                <p>${(error as Error).message}</p>
                <p>Check the console for more details.</p>
            </div>`;
        }
    }
});
