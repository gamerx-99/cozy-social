/**
 * GameScene - Main Phaser scene for the character sandbox.
 * Handles input, camera, character movement, and UI coordination.
 */

import { CharacterSprite, DIRECTIONS, DIRECTION_VECTORS } from './CharacterSprite.js';
import { CharacterAppearance, DEFAULT_APPEARANCE } from './CharacterAppearance.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Game state (separate from appearance)
    this.player = null;
    this.cursors = null;
    this.wasd = null;
    this.moveSpeed = 180; // pixels per second

    // Input state
    this.inputVector = { x: 0, y: 0 };
    this.lastDirection = DIRECTIONS.DOWN;

    // Grid for visual reference
    this.gridGraphics = null;

    // Debug info
    this.debugText = null;
    this.showDebug = false;
  }

  init(data) {
    // Receive initial appearance from data or use default
    this.initialAppearance = data?.appearance || DEFAULT_APPEARANCE.clone();
  }

  preload() {
    // No external assets needed - all procedural
  }

  create() {
    // Scene systems (including cameras) are only available after create starts.
    // Setting the camera in the constructor aborts scene boot and leaves the
    // Phaser canvas black while the rest of the creator never initializes.
    this.cameras.main.setBackgroundColor('#f2e6d4');
    // Create grid background
    this.createGrid();

    // Create player character at center
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    this.player = new CharacterSprite(this, centerX, centerY, this.initialAppearance);
    this.player.setScale(1.9);

    // Set up keyboard input
    this.setupInput();

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(this.scale.width * 0.3, this.scale.height * 0.3);
    this.cameras.main.setZoom(1.15);

    // World bounds (large enough for exploration)
    const worldSize = 4000;
    this.physics.world.setBounds(-worldSize/2, -worldSize/2, worldSize, worldSize);

    // Debug text
    this.debugText = this.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#333333',
      backgroundColor: 'rgba(255,255,255,0.8)',
      padding: { x: 8, y: 6 }
    }).setScrollFactor(0).setDepth(1000).setVisible(this.showDebug);

    // Toggle debug with F1
    this.input.keyboard.on('keydown-F1', () => {
      this.showDebug = !this.showDebug;
      this.debugText.setVisible(this.showDebug);
    });

    // Listen for appearance changes from UI
    this.events.on('appearance-changed', (appearance) => {
      this.player.setAppearance(appearance);
    });

    // Listen for name changes
    this.events.on('name-changed', (name) => {
      const appearance = this.player.getAppearance();
      appearance.displayName = name;
      this.player.setAppearance(appearance);
    });

    // Emit ready event for UI
    this.events.emit('scene-ready', this.player.getAppearance());
  }

  /**
   * Create grid background for spatial reference
   */
  createGrid() {
    this.gridGraphics = this.add.graphics();
    const gridSize = 80;
    const worldSize = 4000;
    const halfWorld = worldSize / 2;

    this.gridGraphics.fillStyle(0xf2e6d4, 1);
    this.gridGraphics.fillRect(-halfWorld, -halfWorld, worldSize, worldSize);
    this.gridGraphics.lineStyle(1, 0xb59a7b, 0.12);

    // Vertical lines
    for (let x = -halfWorld; x <= halfWorld; x += gridSize) {
      this.gridGraphics.lineBetween(x, -halfWorld, x, halfWorld);
    }
    // Horizontal lines
    for (let y = -halfWorld; y <= halfWorld; y += gridSize) {
      this.gridGraphics.lineBetween(-halfWorld, y, halfWorld, y);
    }

    // Soft floor rug under the avatar preview.
    this.gridGraphics.fillStyle(0xe7d1b6, 0.7);
    this.gridGraphics.fillEllipse(0, 10, 180, 98);
    this.gridGraphics.lineStyle(3, 0xf8ecdc, 0.95);
    this.gridGraphics.strokeEllipse(0, 10, 166, 84);
    this.gridGraphics.lineStyle(1, 0xc9ac8d, 0.24);
    this.gridGraphics.strokeEllipse(0, 10, 146, 66);

    this.gridGraphics.setDepth(-10);
  }

  /**
   * Set up keyboard input
   */
  setupInput() {
    // Arrow keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // WASD keys
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // Prevent default browser behavior for arrow keys
    this.input.keyboard.addCapture(['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE']);
  }

  /**
   * Process input and calculate movement vector
   */
  processInput() {
    let x = 0;
    let y = 0;

    // WASD
    if (this.wasd.W.isDown || this.cursors.up.isDown) y -= 1;
    if (this.wasd.S.isDown || this.cursors.down.isDown) y += 1;
    if (this.wasd.A.isDown || this.cursors.left.isDown) x -= 1;
    if (this.wasd.D.isDown || this.cursors.right.isDown) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }

    this.inputVector.x = x;
    this.inputVector.y = y;

    return { x, y };
  }

  /**
   * Calculate direction angle from input vector
   */
  getDirectionFromInput(x, y) {
    if (x === 0 && y === 0) return null;

    const angle = Math.atan2(y, x);

    // Snap to 8 directions
    const eighth = Math.PI / 4;
    let snapped = Math.round(angle / eighth) * eighth;

    // Normalize to -PI to PI
    if (snapped > Math.PI) snapped -= 2 * Math.PI;
    if (snapped < -Math.PI) snapped += 2 * Math.PI;

    return snapped;
  }

  update(time, delta) {
    // Process input
    const input = this.processInput();

    // Determine if moving
    const isMoving = input.x !== 0 || input.y !== 0;

    // Update player movement
    if (isMoving) {
      const direction = this.getDirectionFromInput(input.x, input.y);
      if (direction !== null) {
        this.lastDirection = direction;
        this.player.setDirection(direction);
      }

      // Apply velocity
      this.player.setMoving(true, this.lastDirection);
      this.player.x += input.x * this.moveSpeed * (delta / 1000);
      this.player.y += input.y * this.moveSpeed * (delta / 1000);
    } else {
      this.player.setMoving(false);
    }

    // Update character animation
    this.player.update(time, delta);

    // Update debug info
    if (this.showDebug) {
      this.updateDebugInfo();
    }
  }

  updateDebugInfo() {
    const dirName = this.player.getDirectionName();
    const app = this.player.getAppearance();
    this.debugText.setText([
      `Position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
      `Direction: ${dirName}`,
      `Moving: ${this.player.isMoving}`,
      `Name: ${app.displayName}`,
      `Hair: ${app.hairStyle} (${app.hairColor})`,
      `Shirt: ${app.shirt} (${app.shirtColor})`,
      `Pants: ${app.pants} (${app.pantsColor})`,
      `Shoes: ${app.shoes} (${app.shoeColor})`,
      `Accessory: ${app.accessory}`,
      `Zoom: ${this.cameras.main.zoom.toFixed(2)}`,
      '',
      'Controls:',
      'WASD / Arrows - Move',
      'F1 - Toggle Debug',
      'Mouse - Customize UI (right panel)'
    ].join('\n'));
  }

  /**
   * Get current appearance for saving/exporting
   */
  getAppearance() {
    return this.player.getAppearance();
  }

  /**
   * Set appearance from external source (e.g., UI)
   */
  setAppearance(appearance) {
    this.player.setAppearance(appearance);
  }
}
