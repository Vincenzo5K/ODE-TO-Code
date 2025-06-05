import Phaser from 'phaser';
import { createRoot } from 'react-dom/client';
import TaskModal from '../../components/TaskModal';
import React from 'react';

interface TaskZone {
  name: string;
  x: number;
  y: number;
  completed: boolean;
  contentUrl: string;
  zoneCircle?: Phaser.GameObjects.Arc; // optional reference
}

export default class MapScene extends Phaser.Scene {
  uiMarginTop: number = 60;
  player!: Phaser.Physics.Arcade.Sprite;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  taskZones: TaskZone[] = [
    {
      name: 'Intro Video', x: 150, y: 100, completed: false,
      contentUrl: 'https://youtu.be/YmIbfM7zmrU?si=e6Fgf-6jQngbvouX'
    },
    {
      name: 'Company Handbook', x: 300, y: 200, completed: false,
      contentUrl: '/Resources/SampleQuiz.pdf'
    },
    {
      name: 'Onboarding Slides', x: 500, y: 400, completed: false,
      contentUrl: 'https://view.officeapps.live.com/op/embed.aspx?src=https://example.com/sample.pptx'
    },
    {
      name: 'Company Website', x: 700, y: 250, completed: false,
      contentUrl: 'https://en.wikipedia.org/wiki/Citibank'
    },
    {
      name: 'Instructions', x: 900, y: 200, completed: false,
      contentUrl: 'Welcome to the company! Please read the handbook.'
    },
    {
      name: 'Company Logo', x: 1050, y: 300, completed: false,
      contentUrl: '/Resources//Citibank.png'
    }
  ];
  progressBar!: Phaser.GameObjects.Graphics;
  progressText!: Phaser.GameObjects.Text;
  minimapCamera!: Phaser.Cameras.Scene2D.Camera;
  modalOpen: boolean = false;
  currentZone: TaskZone | null = null;
  modalCooldown: number = 4000;
  lastModalTime: number = 0;
  tooltipText!: Phaser.GameObjects.Text;

  worldWidth: number = 2000;
  worldHeight: number = 1200;

  constructor() {
    super('MapScene');
  }

  preload() {
    this.load.image('tiles', 'map.png');
    this.load.image('player', 'Character.png');
  }

  create() {
    const bg = this.add.image(0, 0, 'tiles').setOrigin(0, 0).setName('background');
    bg.setDisplaySize(this.worldWidth, this.worldHeight);
    bg.setY(this.uiMarginTop);

    this.physics.world.setBounds(0, this.uiMarginTop, this.worldWidth, this.worldHeight - this.uiMarginTop);

    const desiredSize = 48;
    const texture = this.textures.get('player');
    const frame = texture.getSourceImage();
    const scale = desiredSize / Math.max(frame.width, frame.height);

    this.player = this.physics.add.sprite(100, this.uiMarginTop + 100, 'player', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(scale);

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setBounds(0, this.uiMarginTop, this.worldWidth, this.worldHeight - this.uiMarginTop);
    this.cameras.main.startFollow(this.player);

    this.minimapCamera = this.cameras.add(this.scale.width - 200, 20, 180, 150).setZoom(0.25);
    this.minimapCamera.startFollow(this.player);
    this.minimapCamera.setBackgroundColor(0x002244);
    this.minimapCamera.setBounds(0, this.uiMarginTop, this.worldWidth, this.worldHeight - this.uiMarginTop);

    this.taskZones.forEach(zone => {
      const color = zone.completed ? 0x2ecc71 : 0x3498db;
      const zoneCircle = this.add.circle(zone.x, zone.y, 20, color, 0.7);
      this.physics.add.existing(zoneCircle, true);
      zone.zoneCircle = zoneCircle;
    });

    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '14px', backgroundColor: '#ffffff', color: '#000000', padding: { x: 6, y: 4 }, align: 'center',
    }).setDepth(10).setVisible(false);

    this.progressBar = this.add.graphics();
    this.progressBar.setScrollFactor(0);
    this.updateProgressBar();

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const width = gameSize.width;
      this.updateProgressBar();
      this.minimapCamera.setPosition(width - 200, 20);

      const bg = this.children.getByName('background') as Phaser.GameObjects.Image;
      if (bg) bg.setDisplaySize(this.worldWidth, this.worldHeight);
    });
  }

  handleTask(zone: TaskZone) {
    this.modalOpen = true;
    this.currentZone = zone;

    const container = document.createElement('div');
    container.id = 'task-modal-container';
    document.body.appendChild(container);

    const root = createRoot(container);

    const closeModal = () => {
      root.unmount();
      container.remove();
      this.modalOpen = false;
      this.currentZone = null;
    };

    const closeTask = () => {
      closeModal();
    };

    const completeTask = () => {
      zone.completed = true;
      if (zone.zoneCircle) zone.zoneCircle.setFillStyle(0x2ecc71, 0.7);
      this.updateProgressBar();
      closeModal();
    };

    root.render(
      <TaskModal
        task={{ title: zone.name, contentUrl: zone.contentUrl }}
        onClose={closeTask}
        onComplete={completeTask}
      />
    );
  }

  updateProgressBar() {
    const completed = this.taskZones.filter(t => t.completed).length;
    const total = this.taskZones.length;
    const percent = completed / total;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x00ff00);
    const progressWidth = 200;
    const progressHeight = 20;
    const x = this.scale.width / 2 - progressWidth / 2;
    const y = 20;

    this.progressBar.fillRect(x, y, progressWidth * percent, progressHeight);
    this.progressBar.lineStyle(2, 0xffffff);
    this.progressBar.strokeRect(x, y, progressWidth, progressHeight);

    if (this.progressText) this.progressText.destroy();
    this.progressText = this.add.text(x + progressWidth + 10, y - 4, `${Math.round(percent * 100)}%`, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
    }).setScrollFactor(0);
  }

  update() {
    if (this.modalOpen) {
      this.player.setVelocity(0);
      this.player.anims.stop();
      return;
    }

    const now = this.time.now;
    const interactDistance = 50;
    let showTooltip = false;

    const playerX = this.player.x;
    const playerY = this.player.y;

    for (const zone of this.taskZones) {
      const dx = zone.x - playerX;
      const dy = zone.y - playerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100 && !zone.completed) {
        this.tooltipText.setText(zone.name);
        this.tooltipText.setPosition(zone.x + 25, zone.y - 20);
        this.tooltipText.setVisible(true);
        showTooltip = true;
      }

      if (!this.modalOpen && now - this.lastModalTime > this.modalCooldown && !zone.completed && distance < interactDistance) {
        this.handleTask(zone);
        this.lastModalTime = now;
        break;
      }
    }

    if (!showTooltip) this.tooltipText.setVisible(false);

    const speed = 120;
    this.player.setVelocity(0);

    if (this.cursors.left?.isDown) this.player.setVelocityX(-speed);
    else if (this.cursors.right?.isDown) this.player.setVelocityX(speed);

    if (this.cursors.up?.isDown) this.player.setVelocityY(-speed);
    else if (this.cursors.down?.isDown) this.player.setVelocityY(speed);

    if (!this.cursors.left?.isDown && !this.cursors.right?.isDown && !this.cursors.up?.isDown && !this.cursors.down?.isDown) {
      this.player.anims.stop();
    }
  }
}