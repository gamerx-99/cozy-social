/**
 * CharacterSprite - Phaser Game Object that renders the character
 * using procedural graphics (no external assets needed).
 * Handles 8-directional movement animations and idle/walk states.
 */

import { CharacterAppearance } from './CharacterAppearance.js';

// 8-direction constants (Phaser uses angle in radians, 0 = right, clockwise)
export const DIRECTIONS = {
  RIGHT: 0,
  DOWN_RIGHT: Math.PI / 4,
  DOWN: Math.PI / 2,
  DOWN_LEFT: 3 * Math.PI / 4,
  LEFT: Math.PI,
  UP_LEFT: -3 * Math.PI / 4,
  UP: -Math.PI / 2,
  UP_RIGHT: -Math.PI / 4,
};

// Direction vectors for movement
export const DIRECTION_VECTORS = {
  RIGHT: { x: 1, y: 0 },
  DOWN_RIGHT: { x: 1, y: 1 },
  DOWN: { x: 0, y: 1 },
  DOWN_LEFT: { x: -1, y: 1 },
  LEFT: { x: -1, y: 0 },
  UP_LEFT: { x: -1, y: -1 },
  UP: { x: 0, y: -1 },
  UP_RIGHT: { x: 1, y: -1 },
};

// Animation frame rate
const WALK_FRAME_RATE = 10;
const IDLE_FRAME_RATE = 2;

export class CharacterSprite extends Phaser.GameObjects.Container {
  constructor(scene, x, y, appearance) {
    super(scene, x, y);
    scene.add.existing(this);

    this.appearance = appearance;
    this.currentDirection = DIRECTIONS.DOWN;
    this.isMoving = false;
    this.walkCycle = 0;
    this.idleCycle = 0;
    this.lastAnimTime = 0;

    // Body parts (graphics objects)
    this.bodyParts = {
      shadow: null,
      body: null,
      legs: null,
      head: null,
      hair: null,
      outfit: null,
      accessory: null,
      nameLabel: null,
    };

    // Animation state
    this.animFrame = 0;
    this.animTimer = 0;

    this.createGraphics();
    this.updateAppearance();
  }

  /**
   * Create all graphics objects for the character
   */
  createGraphics() {
    // Shadow (always at bottom)
    this.bodyParts.shadow = this.scene.add.graphics();
    this.add(this.bodyParts.shadow);

    // Body container (legs + torso)
    this.bodyParts.body = this.scene.add.graphics();
    this.add(this.bodyParts.body);

    // Head
    this.bodyParts.head = this.scene.add.graphics();
    this.add(this.bodyParts.head);

    // Hair
    this.bodyParts.hair = this.scene.add.graphics();
    this.add(this.bodyParts.hair);

    // Outfit (on top of body)
    this.bodyParts.outfit = this.scene.add.graphics();
    this.add(this.bodyParts.outfit);

    // Accessory (on top of head)
    this.bodyParts.accessory = this.scene.add.graphics();
    this.add(this.bodyParts.accessory);

    // Name label
    this.bodyParts.nameLabel = this.scene.add.text(0, -50, this.appearance.displayName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#333333',
      stroke: '#ffffff',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 1);
    this.add(this.bodyParts.nameLabel);

    // Set render order (bottom to top)
    this.sendToBack(this.bodyParts.shadow);
    this.moveUp(this.bodyParts.body);
    this.moveUp(this.bodyParts.outfit);
    this.moveUp(this.bodyParts.head);
    this.moveUp(this.bodyParts.hair);
    this.moveUp(this.bodyParts.accessory);
    this.moveUp(this.bodyParts.nameLabel);
  }

  /**
   * Update the character's appearance based on current appearance data
   */
  updateAppearance() {
    const skinTone = this.appearance.getSkinTone().hex;
    const hairColor = this.appearance.getHairColor().hex;
    const shirtColor = this.appearance.getShirtColor().hex;
    const pantsColor = this.appearance.getPantsColor().hex;
    const shoeColor = this.appearance.getShoeColor().hex;
    const hairStyle = this.appearance.getHairStyle().id;
    const accessory = this.appearance.getAccessory().id;

    this.bodyParts.nameLabel.setText(this.appearance.displayName);

    // Redraw all parts
    this.drawShadow();
    this.drawBody(skinTone, shirtColor, this.appearance.shirt, pantsColor, this.appearance.pants, shoeColor, this.appearance.shoes, this.appearance.baseType);
    this.drawHead(skinTone, this.appearance.getEyeColor().hex, this.appearance.eyeStyle, this.appearance.baseType);
    this.drawHair(hairColor, hairStyle);
    this.drawAccessory(accessory);
  }

  /**
   * Draw shadow
   */
  drawShadow() {
    const g = this.bodyParts.shadow;
    g.clear();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, 18, 24, 8);
  }

  /**
   * Draw body (torso + legs) with outfit
   */
  drawBody(skinTone, shirtColor, shirtType, pantsColor, pantsType, shoeColor, shoeType, baseType) {
    const g = this.bodyParts.body;
    g.clear();
    const skinHex = Phaser.Display.Color.HexStringToColor(skinTone).color;

    const isWalking = this.isMoving;
    const walkOffset = Math.sin(this.walkCycle) * 2;
    const legOffset = isWalking ? Math.sin(this.walkCycle * 2) * 3 : 0;
    const armSwing = isWalking ? Math.sin(this.walkCycle * 2) * 4 : 0;

    // Torso base position
    const torsoY = -8 + (isWalking ? Math.sin(this.walkCycle) * 1 : 0);

    // Draw legs (behind torso when walking certain directions)
    const legWidth = baseType === 'female' ? 5.5 : 6;
    const legHeight = pantsType === 'shorts' ? 11 : 16;
    const legGap = 2;

    // Left leg
    g.fillStyle(Phaser.Display.Color.HexStringToColor(pantsColor).color, 1);
    g.fillRoundedRect(-legWidth - legGap/2, torsoY + 12 + legOffset, legWidth, legHeight, 3);

    // Right leg
    g.fillRoundedRect(legGap/2, torsoY + 12 - legOffset, legWidth, legHeight, 3);

    // Shoe silhouettes
    const shoeHex = Phaser.Display.Color.HexStringToColor(shoeColor).color;
    g.fillStyle(shoeHex, 1);
    if (shoeType === 'boots') {
      g.fillRoundedRect(-legWidth - legGap/2 - 1, torsoY + 22 + legOffset, legWidth + 3, 7, 2);
      g.fillRoundedRect(legGap/2 - 1, torsoY + 22 - legOffset, legWidth + 3, 7, 2);
    } else if (shoeType === 'slippers') {
      g.fillRoundedRect(-legWidth - legGap/2, torsoY + 25 + legOffset, legWidth + 2, 4, 2);
      g.fillRoundedRect(legGap/2, torsoY + 25 - legOffset, legWidth + 2, 4, 2);
    } else {
      g.fillRoundedRect(-legWidth - legGap/2 - 1, torsoY + 23 + legOffset, legWidth + 4, 6, 3);
      g.fillRoundedRect(legGap/2 - 1, torsoY + 23 - legOffset, legWidth + 4, 6, 3);
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(-legWidth - legGap/2, torsoY + 25 + legOffset, legWidth + 2, 1.5);
      g.fillRect(legGap/2, torsoY + 25 - legOffset, legWidth + 2, 1.5);
    }

    // Jeans seam and short hems make the lower-body choice readable at game scale.
    if (pantsType === 'jeans') {
      g.lineStyle(1, 0xffffff, 0.35);
      g.lineBetween(-1, torsoY + 14, -1, torsoY + 20);
    } else if (pantsType === 'shorts') {
      g.fillStyle(0x3e3937, 0.22);
      g.fillRect(-legWidth - legGap/2, torsoY + 20, legWidth * 2 + legGap, 2);
    }

    // Torso
    const torsoWidth = baseType === 'female' ? 18 : 20;
    const torsoHeight = 22;
    g.fillStyle(Phaser.Display.Color.HexStringToColor(shirtColor).color, 1);
    g.fillRoundedRect(-torsoWidth/2, torsoY - torsoHeight/2, torsoWidth, torsoHeight, 4);

    // Arms (simple rectangles)
    const armWidth = 4;
    const armHeight = 16;
    // Left arm
    g.fillStyle(skinHex, 1);
    g.fillRoundedRect(-torsoWidth/2 - armWidth, torsoY - torsoHeight/2 + 2 + armSwing, armWidth, armHeight, 2);
    // Right arm
    g.fillRoundedRect(torsoWidth/2, torsoY - torsoHeight/2 + 2 - armSwing, armWidth, armHeight, 2);

    // Neck
    g.fillStyle(skinHex, 1);
    g.fillRect(-4, torsoY - torsoHeight/2 - 4, 8, 4);

    // Outfit details based on type
    this.drawOutfitDetails(g, torsoY, torsoWidth, torsoHeight, shirtType, shirtColor, pantsType);
  }

  /**
   * Draw outfit-specific details
   */
  drawOutfitDetails(g, torsoY, torsoWidth, torsoHeight, shirtType, shirtColor, pantsType) {
    const color = Phaser.Display.Color.HexStringToColor(shirtColor);
    const darkerColor = Phaser.Display.Color.GetColor(
      Math.max(0, color.r - 40),
      Math.max(0, color.g - 40),
      Math.max(0, color.b - 40)
    );

    g.fillStyle(darkerColor, 1);

    switch (shirtType) {
      case 'tee':
        g.fillStyle(0xffffff, 0.55);
        g.fillRect(-1, torsoY - torsoHeight/2 + 4, 2, torsoHeight - 7);
        break;
      case 'hoodie':
        // Hood outline
        g.fillRect(-torsoWidth/2 - 2, torsoY - torsoHeight/2 - 10, torsoWidth + 4, 10);
        // Hood strings
        g.fillStyle(0x000000, 0.5);
        g.fillRect(-4, torsoY - torsoHeight/2 - 2, 2, 8);
        g.fillRect(2, torsoY - torsoHeight/2 - 2, 2, 8);
        break;
      case 'jacket':
        // Jacket zipper
        g.fillRect(-1, torsoY - torsoHeight/2, 2, torsoHeight);
        // Lapels
        g.fillStyle(0x000000, 0.3);
        g.fillTriangle(-torsoWidth/2, torsoY - torsoHeight/2, -2, torsoY - torsoHeight/2 + 8, -torsoWidth/2, torsoY - torsoHeight/2 + 8);
        g.fillTriangle(torsoWidth/2, torsoY - torsoHeight/2, 2, torsoY - torsoHeight/2 + 8, torsoWidth/2, torsoY - torsoHeight/2 + 8);
        break;
      case 'vest':
        // Vest outline
        g.fillStyle(0x000000, 0.4);
        g.fillRect(-torsoWidth/2 + 2, torsoY - torsoHeight/2, torsoWidth - 4, torsoHeight);
        // Buttons
        g.fillStyle(0x000000, 0.8);
        for (let i = 0; i < 4; i++) {
          g.fillCircle(0, torsoY - torsoHeight/2 + 4 + i * 5, 1.5);
        }
        break;
      case 'cardigan':
        g.fillStyle(darkerColor, 0.7);
        g.fillRoundedRect(-torsoWidth/2, torsoY - torsoHeight/2, 4, torsoHeight, 2);
        g.fillRoundedRect(torsoWidth/2 - 4, torsoY - torsoHeight/2, 4, torsoHeight, 2);
        g.fillStyle(0xf7e8d4, 0.95);
        g.fillTriangle(-4, torsoY - torsoHeight/2, 0, torsoY - torsoHeight/2 + 6, 0, torsoY - torsoHeight/2);
        g.fillTriangle(4, torsoY - torsoHeight/2, 0, torsoY - torsoHeight/2 + 6, 0, torsoY - torsoHeight/2);
        g.fillStyle(0xf4dfc3, 0.95);
        g.fillRect(-1, torsoY - 1, 2, 2);
        g.fillRect(-1, torsoY + 5, 2, 2);
        break;
      case 'shirt':
      default:
        // Collar
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillTriangle(-torsoWidth/2, torsoY - torsoHeight/2, 0, torsoY - torsoHeight/2 + 6, torsoWidth/2, torsoY - torsoHeight/2);
        // Buttons
        g.fillStyle(0x333333, 0.8);
        for (let i = 0; i < 3; i++) {
          g.fillCircle(0, torsoY - torsoHeight/2 + 8 + i * 5, 1);
        }
        break;
    }

    if (pantsType === 'overalls') {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(shirtColor).color, 1);
      g.fillRoundedRect(-5, torsoY - torsoHeight/2 + 7, 10, 12, 2);
      g.fillStyle(0xe8d2b7, 1);
      g.fillCircle(-3, torsoY - torsoHeight/2 + 7, 1);
      g.fillCircle(3, torsoY - torsoHeight/2 + 7, 1);
    }
  }

  /**
   * Draw head
   */
  drawHead(skinTone, eyeColor, eyeStyle, baseType) {
    const g = this.bodyParts.head;
    g.clear();
    const skinHex = Phaser.Display.Color.HexStringToColor(skinTone).color;

    const headX = 0;
    const headY = -28;
    const headWidth = baseType === 'female' ? 22 : 23;
    const headHeight = baseType === 'female' ? 20 : 21;

    // Head base
    g.fillStyle(skinHex, 1);
    g.fillRoundedRect(headX - headWidth/2, headY - headHeight/2, headWidth, headHeight, 10);

    // Ears
    g.fillRoundedRect(headX - headWidth/2 - 3, headY - 2, 6, 10, 3);
    g.fillRoundedRect(headX + headWidth/2 - 3, headY - 2, 6, 10, 3);

    // Face details (eyes) - direction aware
    const eyeOffset = this.getEyeOffset();
    const iris = Phaser.Display.Color.HexStringToColor(eyeColor).color;
    const eyeRadius = eyeStyle === 'soft' ? 1.7 : 2.2;
    g.fillStyle(0x47352e, 1);
    g.fillEllipse(headX - 5 + eyeOffset.x, headY - 2 + eyeOffset.y, eyeRadius * 2.2, eyeRadius * (eyeStyle === 'soft' ? 1.3 : 2));
    g.fillEllipse(headX + 5 + eyeOffset.x, headY - 2 + eyeOffset.y, eyeRadius * 2.2, eyeRadius * (eyeStyle === 'soft' ? 1.3 : 2));
    g.fillStyle(iris, 1);
    g.fillCircle(headX - 5 + eyeOffset.x, headY - 1.5 + eyeOffset.y, eyeRadius * .7);
    g.fillCircle(headX + 5 + eyeOffset.x, headY - 1.5 + eyeOffset.y, eyeRadius * .7);
    g.fillStyle(0xffffff, .9);
    g.fillCircle(headX - 5.6 + eyeOffset.x, headY - 2.6 + eyeOffset.y, .7);
    g.fillCircle(headX + 4.4 + eyeOffset.x, headY - 2.6 + eyeOffset.y, .7);
    if (eyeStyle === 'sparkle') {
      g.fillStyle(0xffffff, .95);
      g.fillCircle(headX - 3.8 + eyeOffset.x, headY - .6 + eyeOffset.y, .45);
      g.fillCircle(headX + 6.2 + eyeOffset.x, headY - .6 + eyeOffset.y, .45);
    }

    // Blink animation when idle
    if (!this.isMoving && Math.sin(this.idleCycle * 0.5) > 0.95) {
      g.fillStyle(skinHex, 1);
      g.fillRect(headX - 7, headY - 4, 14, 2);
      g.fillRect(headX - 7, headY - 4, 14, 2);
    }
  }

  /**
   * Get eye offset based on facing direction
   */
  getEyeOffset() {
    const offset = 1.5;
    switch (this.getDirectionName()) {
      case 'UP': return { x: 0, y: -offset };
      case 'DOWN': return { x: 0, y: offset };
      case 'LEFT': return { x: -offset, y: 0 };
      case 'RIGHT': return { x: offset, y: 0 };
      case 'UP_LEFT': return { x: -offset, y: -offset };
      case 'UP_RIGHT': return { x: offset, y: -offset };
      case 'DOWN_LEFT': return { x: -offset, y: offset };
      case 'DOWN_RIGHT': return { x: offset, y: offset };
      default: return { x: 0, y: 0 };
    }
  }

  /**
   * Draw hair based on style
   */
  drawHair(hairColor, hairStyle) {
    const g = this.bodyParts.hair;
    g.clear();
    const hairHex = Phaser.Display.Color.HexStringToColor(hairColor).color;

    const headX = 0;
    const headY = -28;
    const headWidth = 22;

    g.fillStyle(hairHex, 1);

    switch (hairStyle) {
      case 'short':
        // Short crop
        g.fillRoundedRect(headX - headWidth/2 - 2, headY - headWidth/2 - 4, headWidth + 4, 10, 5);
        // Side burns
        g.fillRoundedRect(headX - headWidth/2 - 4, headY - 8, 4, 12, 2);
        g.fillRoundedRect(headX + headWidth/2, headY - 8, 4, 12, 2);
        break;
      case 'long':
        // Long hair - back
        g.fillRoundedRect(headX - headWidth/2 - 3, headY - headWidth/2 - 4, headWidth + 6, 18, 6);
        // Front bangs
        g.fillRoundedRect(headX - headWidth/2, headY - headWidth/2 - 2, headWidth, 6, 3);
        // Sides
        g.fillRoundedRect(headX - headWidth/2 - 5, headY - 8, 5, 20, 2);
        g.fillRoundedRect(headX + headWidth/2, headY - 8, 5, 20, 2);
        break;
      case 'spiky':
        // Spiky hair - multiple triangles
        for (let i = 0; i < 5; i++) {
          const spikeX = headX - headWidth/2 + i * (headWidth / 4);
          g.fillTriangle(
            spikeX, headY - 2,
            spikeX + headWidth / 8, headY - 14,
            spikeX + headWidth / 4, headY - 2
          );
        }
        // Side spikes
        g.fillTriangle(headX - headWidth/2 - 2, headY, headX - headWidth/2 - 6, headY - 6, headX - headWidth/2, headY - 8);
        g.fillTriangle(headX + headWidth/2 + 2, headY, headX + headWidth/2 + 6, headY - 6, headX + headWidth/2, headY - 8);
        break;
      case 'bob':
        // Bob cut - chin length, straight
        g.fillRoundedRect(headX - headWidth/2 - 2, headY - headWidth/2 - 4, headWidth + 4, 14, 4);
        // Bangs
        g.fillRoundedRect(headX - headWidth/2, headY - headWidth/2 - 2, headWidth, 5, 2);
        // Sides curved
        g.fillRoundedRect(headX - headWidth/2 - 4, headY - 6, 4, 16, 2);
        g.fillRoundedRect(headX + headWidth/2, headY - 6, 4, 16, 2);
        break;
    }
  }

  /**
   * Draw accessory
   */
  drawAccessory(accessoryId) {
    const g = this.bodyParts.accessory;
    g.clear();

    const headX = 0;
    const headY = -28;

    const accessory = this.appearance.getAccessory();
    const offsetX = accessory.offset.x;
    const offsetY = accessory.offset.y;

    switch (accessoryId) {
      case 'glasses':
        g.lineStyle(2, 0x333333, 1);
        g.strokeRoundedRect(headX - 12 + offsetX, headY - 6 + offsetY, 10, 8, 2);
        g.strokeRoundedRect(headX + 2 + offsetX, headY - 6 + offsetY, 10, 8, 2);
        g.lineBetween(headX - 2 + offsetX, headY - 2 + offsetY, headX + 2 + offsetX, headY - 2 + offsetY);
        break;
      case 'headphones':
        g.lineStyle(3, 0x444444, 1);
        g.strokeEllipse(headX + offsetX, headY - 8 + offsetY, 30, 28);
        // Ear cups
        g.fillStyle(0x222222, 1);
        g.fillCircle(headX - 15 + offsetX, headY - 8 + offsetY, 8);
        g.fillCircle(headX + 15 + offsetX, headY - 8 + offsetY, 8);
        break;
      case 'hat':
        // Baseball cap
        g.fillStyle(0x333333, 1);
        g.fillRoundedRect(headX - 14 + offsetX, headY - 22 + offsetY, 28, 6, 3);
        // Brim
        g.fillRoundedRect(headX - 16 + offsetX, headY - 18 + offsetY, 32, 4, 1);
        break;
      case 'bow':
        g.fillStyle(0xFF69B4, 1);
        // Left loop
        g.fillEllipse(headX - 6 + offsetX, headY - 14 + offsetY, 8, 10);
        // Right loop
        g.fillEllipse(headX + 6 + offsetX, headY - 14 + offsetY, 8, 10);
        // Center knot
        g.fillCircle(headX + offsetX, headY - 12 + offsetY, 3);
        break;
      case 'mask':
        g.fillStyle(0xFFFFFF, 1);
        g.fillRoundedRect(headX - 10 + offsetX, headY + 2 + offsetY, 20, 8, 4);
        // Mask strings
        g.lineStyle(1, 0xCCCCCC, 1);
        g.lineBetween(headX - 10 + offsetX, headY + 6 + offsetY, headX - 14 + offsetX, headY + 2 + offsetY);
        g.lineBetween(headX + 10 + offsetX, headY + 6 + offsetY, headX + 14 + offsetX, headY + 2 + offsetY);
        break;
    }
  }

  /**
   * Set movement state
   */
  setMoving(moving, direction = null) {
    this.isMoving = moving;
    if (direction !== null) {
      this.currentDirection = direction;
    }
    if (moving) {
      this.walkCycle = 0;
    } else {
      this.idleCycle = 0;
    }
  }

  /**
   * Set facing direction
   */
  setDirection(direction) {
    this.currentDirection = direction;
  }

  /**
   * Get direction name from angle
   */
  getDirectionName() {
    const angle = this.currentDirection;
    const pi = Math.PI;
    const eighth = pi / 4;

    if (angle >= -eighth && angle < eighth) return 'RIGHT';
    if (angle >= eighth && angle < 3 * eighth) return 'DOWN_RIGHT';
    if (angle >= 3 * eighth && angle < 5 * eighth) return 'DOWN';
    if (angle >= 5 * eighth && angle < 7 * eighth) return 'DOWN_LEFT';
    if (angle >= 7 * eighth || angle < -7 * eighth) return 'LEFT';
    if (angle >= -7 * eighth && angle < -5 * eighth) return 'UP_LEFT';
    if (angle >= -5 * eighth && angle < -3 * eighth) return 'UP';
    if (angle >= -3 * eighth && angle < -eighth) return 'UP_RIGHT';
    return 'DOWN';
  }

  /**
   * Update animation frame
   */
  update(time, delta) {
    if (this.isMoving) {
      this.walkCycle += delta * 0.01;
      this.animTimer += delta;
      if (this.animTimer > 1000 / WALK_FRAME_RATE) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.idleCycle += delta * 0.001;
      this.animTimer += delta;
      if (this.animTimer > 1000 / IDLE_FRAME_RATE) {
        this.animFrame = (this.animFrame + 1) % 2;
        this.animTimer = 0;
      }
    }

    // Update name label position to always face camera
    this.bodyParts.nameLabel.setPosition(0, -50);
  }

  /**
   * Update appearance (call when appearance data changes)
   */
  setAppearance(appearance) {
    this.appearance = appearance;
    this.updateAppearance();
  }

  /**
   * Get current appearance data
   */
  getAppearance() {
    return this.appearance.clone();
  }
}
