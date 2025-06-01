export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;

    // Example game state
    private playerX: number = 50;
    private playerY: number = 50;
    private playerSpeed: number = 200; // pixels per second

    private keysPressed: { [key: string]: boolean } = {};

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id ${canvasId} not found.`);
        }
        this.ctx = this.canvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('2D rendering context not available.');
        }

        // Set canvas dimensions (you might want to make this dynamic)
        this.canvas.width = 800;
        this.canvas.height = 600;

        this.init();
    }

    private init(): void {
        // Initialize event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        // Add more listeners as needed (e.g., mousedown, mousemove)

        console.log("Game initialized. Canvas dimensions:", this.canvas.width, "x", this.canvas.height);
        // Start the game loop
        this.gameLoop(0); // Pass initial timestamp
    }

    private handleKeyDown(event: KeyboardEvent): void {
        this.keysPressed[event.key] = true;
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this.keysPressed[event.key] = false;
    }

    private update(deltaTime: number): void {
        // DeltaTime is in seconds (e.g., 0.016 for 60FPS)
        // Game logic updates based on input and time
        if (this.keysPressed['ArrowLeft'] || this.keysPressed['a']) {
            this.playerX -= this.playerSpeed * deltaTime;
        }
        if (this.keysPressed['ArrowRight'] || this.keysPressed['d']) {
            this.playerX += this.playerSpeed * deltaTime;
        }
        if (this.keysPressed['ArrowUp'] || this.keysPressed['w']) {
            this.playerY -= this.playerSpeed * deltaTime;
        }
        if (this.keysPressed['ArrowDown'] || this.keysPressed['s']) {
            this.playerY += this.playerSpeed * deltaTime;
        }

        // Keep player within canvas bounds (simple example)
        this.playerX = Math.max(0, Math.min(this.canvas.width - 20, this.playerX)); // Assuming player width 20
        this.playerY = Math.max(0, Math.min(this.canvas.height - 20, this.playerY)); // Assuming player height 20
    }

    private draw(): void {
        // Clear the canvas
        this.ctx.fillStyle = '#222'; // Dark background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw game elements
        this.ctx.fillStyle = 'cyan';
        this.ctx.fillRect(this.playerX, this.playerY, 20, 20); // Draw a simple player rectangle

        // Draw other things (enemies, score, etc.)
    }

    private gameLoop(timestamp: number): void {
        const deltaTime = (timestamp - this.lastTime) / 1000; // Convert milliseconds to seconds
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        // Request the next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    public start(): void {
        // This method is mostly a placeholder if gameLoop starts in init.
        // Could be used if you want to explicitly start after some loading.
        console.log("Game started!");
    }
}