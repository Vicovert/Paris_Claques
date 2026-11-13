import Phaser from 'phaser';

interface GameStateData {
  score: number;
  highScore: number;
  lives: number;
  combo: number;
  soundMuted: boolean;
}

class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyQ!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  
  private enemies!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.Group;
  
  private scrollSpeed: number = 220;
  private distance: number = 0;
  private shieldActive: boolean = false;
  private isSlapping: boolean = false;
  
  constructor() {
    super('MainScene');
  }

  create() {
    const width = 480;
    const height = 720;

    // Background haussmannien style en gradient & grille
    this.add.rectangle(width / 2, height / 2, width, height, 0x14161d);

    // Route centrale
    this.add.rectangle(width / 2, height / 2, 240, height, 0x2c303b);
    this.add.rectangle(120, height / 2, 4, height, 0xcdc6b2);
    this.add.rectangle(360, height / 2, 4, height, 0xcdc6b2);

    // Groupes
    this.enemies = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    // Joueur
    this.player = this.physics.add.sprite(240, 575, '');
    this.player.setCollideWorldBounds(true);
    
    // Dessin placeholder joueur (gilet jaune)
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xd9ef1c, 1);
    graphics.fillRect(-12, -20, 24, 40);
    graphics.generateTexture('player_tex', 30, 45);
    this.player.setTexture('player_tex');

    // Commandes Clavier
    if (this.input.keyboard) {
      this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Spawns réguliers
    this.time.addEvent({ delay: 1200, callback: this.spawnEnemy, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 2000, callback: this.spawnObstacle, callbackScope: this, loop: true });

    // UI Listeners HTML
    this.setupUI();
  }

  update(time: number, delta: number) {
    const dt = delta / 1000;
    this.distance += this.scrollSpeed * dt;

    // Gestion déplacement
    let vx = 0;
    if (this.keyQ?.isDown || this.cursors?.left.isDown) vx = -280;
    else if (this.keyD?.isDown || this.cursors?.right.isDown) vx = 280;
    this.player.setVelocityX(vx);

    // Bouclier
    this.shieldActive = this.keySpace?.isDown || false;

    // Claques
    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.triggerSlap(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.triggerSlap(1);
    }

    // Mise à jour ennemis
    this.enemies.children.iterate((c: any) => {
      if (c && c.active) {
        c.y += this.scrollSpeed * dt;
        if (c.y > 800) c.destroy();
      }
      return true;
    });

    // Mise à jour obstacles
    this.obstacles.children.iterate((c: any) => {
      if (c && c.active) {
        c.y += this.scrollSpeed * dt;
        if (c.y > 800) c.destroy();
      }
      return true;
    });
  }

  private spawnEnemy() {
    const x = Math.random() < 0.5 ? 140 : 340;
    const enemy = this.physics.add.sprite(x, -50, '');
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x22345c, 1);
    g.fillRect(-12, -20, 24, 40);
    g.generateTexture('cop_tex', 30, 45);
    enemy.setTexture('cop_tex');
    this.enemies.add(enemy);
  }

  private spawnObstacle() {
    const x = Phaser.Math.Between(150, 330);
    const obs = this.physics.add.sprite(x, -60, '');
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x33373d, 1);
    g.fillRect(-18, -25, 36, 50);
    g.generateTexture('obs_tex', 40, 55);
    obs.setTexture('obs_tex');
    this.obstacles.add(obs);
  }

  private triggerSlap(dir: number) {
    if (this.isSlapping) return;
    this.isSlapping = true;
    
    // Vérifier collision claque
    this.enemies.children.iterate((e: any) => {
      if (e && e.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
        if (dist < 90 && ((e.x > this.player.x && dir > 0) || (e.x < this.player.x && dir < 0))) {
          e.destroy();
          window.dispatchEvent(new CustomEvent('game-score', { detail: 10 }));
        }
      }
      return true;
    });

    this.time.delayedCall(300, () => {
      this.isSlapping = false;
    });
  }

  private setupUI() {
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const startScreen = document.getElementById('start-screen');
    const gameoverScreen = document.getElementById('gameover-screen');
    const scoreEl = document.getElementById('hud-score');
    const goScoreEl = document.getElementById('go-score');
    const goBestEl = document.getElementById('go-best');
    
    let scoreVal = 0;
    let bestVal = parseInt(localStorage.getItem('paris_claques_best') || '0', 10);

    window.addEventListener('game-score', ((e: CustomEvent) => {
      scoreVal += e.detail;
      if (scoreEl) scoreEl.textContent = scoreVal.toString();
    }) as EventListener);

    startBtn?.addEventListener('click', () => {
      startScreen?.classList.add('hidden');
    });

    restartBtn?.addEventListener('click', () => {
      scoreVal = 0;
      if (scoreEl) scoreEl.textContent = '0';
      gameoverScreen?.classList.add('hidden');
    });

    document.getElementById('btn-slap-left')?.addEventListener('pointerdown', () => this.triggerSlap(-1));
    document.getElementById('btn-slap-right')?.addEventListener('pointerdown', () => this.triggerSlap(1));
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 720,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [MainScene]
};

new Phaser.Game(config);
