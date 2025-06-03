import Phaser from 'phaser';
import { userService } from '../../api/api';

export default class MapScene extends Phaser.Scene {
  uiMarginTop = 60;
  player = null;
  cursors = null;

  user;
  taskZones;

  minimapCamera = null;

  tooltipText = null;
  tooltipBg = null;
  tooltipShadow = null;
  tooltipTween = null;
  currentTooltipText = null;

  isModalOpen = false;

  lastModalTime = 0;
  modalCooldown = 4000;

  worldWidth;
  worldHeight;

  onTaskTrigger;
  onProgressUpdate;

  constructor(config) {
    super('MapScene');
    this.onTaskTrigger = config.onTaskTrigger;
    this.onProgressUpdate = config.onProgressUpdate;
    this.worldWidth = config.worldWidth || 2000;
    this.worldHeight = config.worldHeight || 1200;
    this.taskZones = config.initialTasks;
    this.user = config.user;
  }

  preload() {
    this.load.image('tiles', 'desert-map.jpg');
    // this.load.image('tiles', 'map.png');
    this.load.image('player', 'Character.png');
  }

  create() {
    console.log('🗺️ MapScene.create() called');
    console.log('📍 Task zones in scene:', this.taskZones);

    // Background image setup
    const bg = this.add.image(0, 0, 'tiles').setOrigin(0, 0).setName('background');
    bg.setDisplaySize(this.worldWidth, this.worldHeight);
    bg.setY(this.uiMarginTop);

    this.physics.world.setBounds(0, this.uiMarginTop, this.worldWidth, this.worldHeight - this.uiMarginTop);

    // Player setup
    this.createPlayer();

    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.setBounds(0, this.uiMarginTop, this.worldWidth, this.worldHeight - this.uiMarginTop);
    this.cameras.main.startFollow(this.player);

    // Create minimap camera and styling
    this.createMinimapCamera();
    this.createMinimapStyle();

    // Draw task zones
    this.taskZones.forEach(zone => this.createTaskZone(zone));

    // Tooltip setup
    this.createTooltip();

    // Resize handler for minimap position and background size
    this.scale.on('resize', (gameSize) => {
      const width = gameSize.width;
      this.minimapCamera.setPosition(width - 200, 20);

      const bg = this.children.getByName('background');
      if (bg && bg.setDisplaySize) bg.setDisplaySize(this.worldWidth, this.worldHeight);

      // Also update minimap style position on resize
      this.updateMinimapStylePosition(width);
    });
  }

  update() {
    if (!this.player || !this.cursors) return;

    if (this.isModalOpen) {
      this.player.setVelocity(0);
      return;
    }

    // Update player glow position
    if (this.playerGlow) {
      this.playerGlow.setPosition(this.player.x, this.player.y);
    }
    if (this.playerGlow2) {
      this.playerGlow2.setPosition(this.player.x, this.player.y);
    }
    if (this.playerGlow3) {
      this.playerGlow3.setPosition(this.player.x, this.player.y);
    }
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 10);
    }

    const now = this.time.now;
    const interactDistance = 50;
    let showTooltip = false;

    const playerX = this.player.x;
    const playerY = this.player.y;

    localStorage.setItem('playerX', playerX);
    localStorage.setItem('playerY', playerY);

    for (const zone of this.taskZones) {
      const dx = zone.x - playerX;
      const dy = zone.y - playerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        let tooltipText = zone.name;
        if (zone.completed) {
          tooltipText += ' ✓';  // add a checkmark for completed
        }
        this.updateTooltip({ x: zone.x, y: zone.y }, tooltipText);
        showTooltip = true;
      }

      if (now - this.lastModalTime > this.modalCooldown && !zone.completed && distance < interactDistance) {
        this.onTaskTrigger(zone);
        this.lastModalTime = now;
        break;
      }
    }

    if (!showTooltip) {
      this.updateTooltip(null, null); // hides tooltip with fade-out
    }

    const speed = 120;
    this.player.setVelocity(0);

    if (this.cursors.left?.isDown) this.player.setVelocityX(-speed);
    else if (this.cursors.right?.isDown) this.player.setVelocityX(speed);

    if (this.cursors.up?.isDown) this.player.setVelocityY(-speed);
    else if (this.cursors.down?.isDown) this.player.setVelocityY(speed);
  }

  async completeZone(zone) {
    try {
      await userService.updateTaskStatus(this.user, zone.name, true);

      zone.completed = true;
      if (zone.zoneCircle) zone.zoneCircle.setFillStyle(0x2ecc71, 0.7);

      const completedCount = this.taskZones.filter(t => t.completed).length;
      this.onProgressUpdate(completedCount, this.taskZones.length);
      localStorage.setItem('taskList', JSON.stringify(this.taskZones));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  }

  updateTasks(newTasks) {
    this.taskZones.forEach(zone => {
      if (zone.zoneCircle) {
        zone.zoneCircle.destroy();
      }
    });

    this.taskZones = newTasks;

    this.taskZones.forEach(zone => this.createTaskZone(zone));
  }

  handleLogout() {
    console.log('Logging out...');
    localStorage.removeItem('soeid');
    localStorage.removeItem('taskList');
    localStorage.removeItem('completedTasks');
    localStorage.removeItem('totalTasks');
    localStorage.removeItem('playerX');
    localStorage.removeItem('playerY');
    window.location.href = '/';
  }

  setModalOpen(isOpen) {
    this.isModalOpen = isOpen;
  }

  // Player setup
  createPlayer() {
    const desiredSize = 48;
    const texture = this.textures.get('player');
    const frame = texture.getSourceImage();
    const scale = desiredSize / Math.max(frame.width, frame.height);

    const initialX = parseFloat(localStorage.getItem('playerX')) || 100;
    const initialY = parseFloat(localStorage.getItem('playerY')) || this.uiMarginTop + 100;

    this.player = this.physics.add.sprite(initialX, initialY, 'player', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(scale);

    // Glow effect
    this.playerGlow = this.add.circle(initialX, initialY, 28, 0xffff00, 0.3);
    this.playerGlow.setDepth(0);

    this.tweens.add({
      targets: this.playerGlow,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 0.3, to: 0.5 },
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut',
    });

    // Shadow below the player
    this.playerShadow = this.add.ellipse(initialX, initialY + 10, 26, 10, 0x000000, 0.25);
    this.playerShadow.setDepth(0);
    this.playerShadow.setScale(1);
    this.playerShadow.setAlpha(0.25);

    this.tweens.add({
      targets: this.player,
      scaleX: { from: scale * 1.0, to: scale * 1.05 },
      scaleY: { from: scale * 1.0, to: scale * 0.95 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

    // Additional soft glow layer (increased visibility for contrast)
    this.playerGlow2 = this.add.circle(initialX, initialY, 38, 0xffff99, 0.25);
    this.playerGlow2.setDepth(-1); // behind everything

    this.tweens.add({
      targets: this.playerGlow2,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.25, to: 0.35 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

    // Third glow layer - more noticeable blue outer pulse
    this.playerGlow3 = this.add.circle(initialX, initialY, 50, 0x33ccff, 0.25);
    this.playerGlow3.setDepth(-3);

    this.tweens.add({
      targets: this.playerGlow3,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.25, to: 0.35 },
      yoyo: true,
      repeat: -1,
      duration: 1600,
      ease: 'Sine.easeInOut',
    });
  }

  createTaskZone(zone) {
    const zoneColor = zone.completed ? 0x2ecc71 : 0x3498db;
    const borderColor = 0xffffff;

    // Create border circle
    const borderCircle = this.add.circle(zone.x, zone.y, 20, borderColor, 1);
    borderCircle.setDepth(1);

    // Create main zone circle
    const zoneCircle = this.add.circle(zone.x, zone.y, 18, zoneColor, 0.9);
    zoneCircle.setDepth(2);
    this.physics.add.existing(zoneCircle, true);
    zone.zoneCircle = zoneCircle;

    if (!zone.completed) {
      this.tweens.add(
        {
          targets: zoneCircle,
          color: borderColor,
          alpha: 0.5,
          yoyo: true,
          repeat: -1,
          duration: 1000,
          ease: 'Sine.easeInOut',
        });
    }
  }

  // New method to create the minimap camera
  createMinimapCamera() {
    this.minimapCamera = this.cameras.add(this.scale.width - 200, 20, 180, 150).setZoom(0.25);
    this.minimapCamera.startFollow(this.player);
    this.minimapCamera.setBackgroundColor(0x002244);
    this.minimapCamera.setBounds(0, this.uiMarginTop, this.worldWidth, this.worldHeight - this.uiMarginTop);
  }

  // In createMinimapStyle(), update shadow drawing for more spread:
  createMinimapStyle() {
    const borderThickness = 4;
    const minimapX = this.scale.width - 200;
    const minimapY = 20;
    const minimapWidth = 180;
    const minimapHeight = 150;
    const cornerRadius = 15;
    const shadowOffset = 3;       // increased for more spread
    const shadowAlpha = 0.2;       // softer shadow

    // Clear previous if any (optional safety)
    if (this.minimapShadow) this.minimapShadow.clear();

    // Shadow (larger, more spread, softer)
    this.minimapShadow = this.add.graphics();
    this.minimapShadow.fillStyle(0x000000, shadowAlpha);
    this.minimapShadow.fillRoundedRect(
      minimapX - borderThickness + shadowOffset,
      minimapY - borderThickness + shadowOffset,
      minimapWidth + borderThickness * 2 + shadowOffset * 2,  // expanded width
      minimapHeight + borderThickness * 2 + shadowOffset * 2, // expanded height
      cornerRadius + shadowOffset // bigger radius for shadow
    );
    this.minimapShadow.setScrollFactor(0);

    // Background (with rounded corners)
    this.minimapBg = this.add.graphics();
    this.minimapBg.fillStyle(0x000000, 0.6);
    this.minimapBg.fillRoundedRect(
      minimapX - borderThickness,
      minimapY - borderThickness,
      minimapWidth + borderThickness * 2,
      minimapHeight + borderThickness * 2,
      cornerRadius
    );
    this.minimapBg.setScrollFactor(0);

    // Border (white rounded border)
    this.minimapBorder = this.add.graphics();
    this.minimapBorder.lineStyle(borderThickness, 0xffffff, 0.9);
    this.minimapBorder.strokeRoundedRect(
      minimapX - borderThickness,
      minimapY - borderThickness,
      minimapWidth + borderThickness * 2,
      minimapHeight + borderThickness * 2,
      cornerRadius
    );
    this.minimapBorder.setScrollFactor(0);

    // Create a rounded rectangle mask for the minimap camera
    if (this.minimapMask) {
      this.minimapMask.destroy();
    }
    this.minimapMask = this.make.graphics();
    this.minimapMask.fillStyle(0xffffff);
    this.minimapMask.fillRoundedRect(
      minimapX,
      minimapY,
      minimapWidth,
      minimapHeight,
      cornerRadius
    );

    this.minimapCamera.setMask(
      new Phaser.Display.Masks.GeometryMask(this, this.minimapMask)
    );
  }

  // Update minimap style position accordingly:
  updateMinimapStylePosition(newWidth) {
    const borderThickness = 4;
    const minimapX = newWidth - 200;
    const minimapY = 20;
    const minimapWidth = 180;
    const minimapHeight = 150;
    const cornerRadius = 15;
    const shadowOffset = 3;
    const shadowAlpha = 0.2;

    if (this.minimapShadow) {
      this.minimapShadow.clear();
      this.minimapShadow.fillStyle(0x000000, shadowAlpha);
      this.minimapShadow.fillRoundedRect(
        minimapX - borderThickness + shadowOffset,
        minimapY - borderThickness + shadowOffset,
        minimapWidth + borderThickness * 2 + shadowOffset * 2,
        minimapHeight + borderThickness * 2 + shadowOffset * 2,
        cornerRadius + shadowOffset
      );
    }

    if (this.minimapBg) {
      this.minimapBg.clear();
      this.minimapBg.fillStyle(0x000000, 0.6);
      this.minimapBg.fillRoundedRect(
        minimapX - borderThickness,
        minimapY - borderThickness,
        minimapWidth + borderThickness * 2,
        minimapHeight + borderThickness * 2,
        cornerRadius
      );
    }

    if (this.minimapBorder) {
      this.minimapBorder.clear();
      this.minimapBorder.lineStyle(borderThickness, 0xffffff, 0.9);
      this.minimapBorder.strokeRoundedRect(
        minimapX - borderThickness,
        minimapY - borderThickness,
        minimapWidth + borderThickness * 2,
        minimapHeight + borderThickness * 2,
        cornerRadius
      );
    }

    if (this.minimapMask) {
      this.minimapMask.clear();
      this.minimapMask.fillStyle(0xffffff);
      this.minimapMask.fillRoundedRect(
        minimapX,
        minimapY,
        minimapWidth,
        minimapHeight,
        cornerRadius
      );
    }
  }

  createTooltip() {
    const borderRadius = 10;

    // Shadow for tooltip (spread drop shadow)
    this.tooltipShadow = this.add.graphics().setDepth(8).setVisible(false);

    // Background with border and rounded corners
    this.tooltipBg = this.add.graphics().setDepth(9).setVisible(false);

    // Tooltip text
    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '13px',
      color: '#000000',
      fontFamily: 'Segoe UI, sans-serif',
      padding: { x: 5, y: 5 },
      align: 'center',
    }).setDepth(10).setVisible(false);

    // Store border radius for reuse
    this.tooltipBorderRadius = borderRadius;
  }

  updateTooltip(position, text) {
    const paddingX = 5;
    const paddingY = 5;
    const borderColor = 0x007bff; // Blue border

    if (!text) {
      if (this.currentTooltipText !== null) {
        this.currentTooltipText = null;
        if (this.tooltipTween) this.tooltipTween.stop();
        this.tooltipTween = this.tweens.add({
          targets: [this.tooltipText, this.tooltipBg, this.tooltipShadow],
          alpha: 0,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            this.tooltipText.setVisible(false);
            this.tooltipBg.setVisible(false);
            this.tooltipShadow.setVisible(false);
          }
        });
      }
      return;
    }

    if (this.currentTooltipText === text) {
      return;
    }

    this.currentTooltipText = text;
    this.tooltipText.setText(text);

    // Center the tooltip around the position
    // Calculate total width and height with padding
    const width = this.tooltipText.width + paddingX * 2;
    const height = this.tooltipText.height + paddingY * 2;
    const r = this.tooltipBorderRadius;

    // Adjust position so tooltip centers horizontally and vertically on `position`
    const x = position.x - width / 2;  // horizontally center tooltip around x
    const marginAbove = 25;             // vertical space above zone
    const y = position.y - height - marginAbove; // tooltip sits above zone

    // Position text inside tooltip bg with padding
    this.tooltipText.setPosition(x + paddingX, y + paddingY);

    // Draw shadow behind (offset for shadow)
    this.tooltipShadow.clear();
    this.tooltipShadow.fillStyle(0x000000, 0.3);
    this.tooltipShadow.fillRoundedRect(x + 5, y + 5, width, height, r);
    this.tooltipShadow.setVisible(true);
    this.tooltipShadow.alpha = 1;

    // Draw background with border
    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0xffffff, 1);
    this.tooltipBg.fillRoundedRect(x, y, width, height, r);
    this.tooltipBg.lineStyle(2, borderColor, 1);
    this.tooltipBg.strokeRoundedRect(x, y, width, height, r);
    this.tooltipBg.setVisible(true);
    this.tooltipBg.alpha = 1;

    // Show text
    this.tooltipText.setVisible(true);
    this.tooltipText.alpha = 1;

    // Fade-in animation if just appearing
    if (!this.tooltipTween || !this.tooltipTween.isPlaying()) {
      this.tooltipText.alpha = 0;
      this.tooltipBg.alpha = 0;
      this.tooltipShadow.alpha = 0;

      this.tooltipTween = this.tweens.add({
        targets: [this.tooltipText, this.tooltipBg, this.tooltipShadow],
        alpha: 1,
        duration: 300,
        ease: 'Power2',
      });
    }
  }
}