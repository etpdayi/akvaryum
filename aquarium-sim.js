/**
 * Akvaryum - Kişisel Sanal Bebek (Tamagotchi) Simülasyon Motoru
 * FishVille Sanat Tasarımı, Bölgesel Yosunlaşma, Oksijen Seviyesi,
 * 10 dk Ana Yem, AFK Gold Farm ve Kozmetik Yüzme İzi Motoru.
 */

class PersonalAquarium {
    constructor(canvasId, glassCanvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.glassCanvas = document.getElementById(glassCanvasId);
        this.glassCtx = this.glassCanvas ? this.glassCanvas.getContext('2d') : null;

        this.fishData = null;
        this.fishImg = null;

        // Balık Durumu & Pozisyon
        this.fish = {
            x: 200,
            y: 200,
            targetX: 200,
            targetY: 200,
            vx: 0,
            vy: 0,
            angle: 0,
            facingRight: true,
            scale: 0.6,
            level: 1,
            maxLevel: 10,
            health: 100,
            isSick: false,
            happiness: 100,
            wiggleTimer: 0
        };

        // Hayatta Kalma Parametreleri
        this.oxygen = 85; // 0 - 100%
        
        // Bölgesel Yosunlaşma (Regional Algae Patches)
        // Sürekli piksel piksel kirlenmek yerine, belirli aralıklarla bölgesel lekeler oluşur
        this.algaePatches = []; // { id, x, y, radius, opacity, health }
        this.algaeSpawnInterval = 45; // Her 45 saniyede bir yeni yosun lekesi
        this.algaeSpawnTimer = 0;
        this.algaeDirty = 0; // 0 - 100% (Leke sayısına göre)
        
        // Yem Mekaniği (10 dakika = 600 saniye)
        this.feedCooldownMax = 600;
        this.feedCooldown = 0;
        this.isFastTestMode = false;
        this.foodPellets = [];

        // AFK Gold Farming
        this.gold = 50;
        this.afkFarmInterval = 60;
        this.afkFarmTimer = 0;
        this.goldPerTick = 10;
        this.goldPopups = [];

        // Kozmetikler
        this.equippedCosmetics = {
            trail: 'default',
            decor: 'none',
            theme: 'fishville'
        };
        this.swimTrails = [];

        // Ziyaret / Misafirlik
        this.isGuestMode = false;
        this.guestOwner = null;
        this.myOwnFishBackup = null;

        // Efektler & Baloncuklar
        this.bubbles = [];
        this.cleaningParticles = [];
        this.isWipingGlass = false;
        this.isAscending = false;

        this.lastTime = performance.now();
        this.animFrame = null;

        this.onLevelUpCallback = null;
        this.onFullGrownCallback = null;
        this.onStatusChangeCallback = null;
        this.onReleaseCallback = null;
        this.onGoldEarnedCallback = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupGlassCleaningEvents();
        this.setupFoodClickEvents();
        
        // Başlangıçta 1 adet küçük bölgesel yosun lekesi
        this.spawnAlgaePatch();
        this.startLoop();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        if (this.glassCanvas) {
            this.glassCanvas.width = rect.width;
            this.glassCanvas.height = rect.height;
        }

        if (this.fish.x === 200 && this.fish.y === 200) {
            this.fish.x = this.canvas.width / 2;
            this.fish.y = this.canvas.height / 2;
            this.fish.targetX = this.fish.x;
            this.fish.targetY = this.fish.y;
        }
    }

    // Bölgesel Yosun Lekesi Oluştur (Zaman aralıklı)
    spawnAlgaePatch() {
        if (this.algaePatches.length >= 5) return; // Maksimum 5 bölgesel leke

        const w = this.canvas.width || 800;
        const h = this.canvas.height || 500;

        // Camın rastgele bir bölgesinde leke konumu
        const marginX = w * 0.12;
        const marginY = h * 0.15;
        const x = marginX + Math.random() * (w - marginX * 2);
        const y = marginY + Math.random() * (h - marginY * 2.2);

        this.algaePatches.push({
            id: 'patch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            x: x,
            y: y,
            radius: 35 + Math.random() * 25, // 35px - 60px yarıçaplı dairesel leke
            health: 1.0, // 1.0 -> 0.0 silindikçe azalır
            maxHealth: 1.0,
            wiggleOffset: Math.random() * Math.PI * 2
        });

        this.updateAlgaePercentage();
        this.checkHealth();
        this.notifyStatusChange();
    }

    updateAlgaePercentage() {
        // Her leke yaklaşık %20 kirlilik verir
        let totalHealth = 0;
        for (const p of this.algaePatches) {
            totalHealth += p.health;
        }
        this.algaeDirty = Math.min(100, Math.round(totalHealth * 20));
    }

    loadFish(fishData, savedProgress = null) {
        this.fishData = fishData;
        const img = new Image();
        img.onload = () => {
            this.fishImg = img;
            if (savedProgress) {
                this.fish.level = savedProgress.level || 1;
                this.oxygen = savedProgress.oxygen !== undefined ? savedProgress.oxygen : 85;
                this.algaeDirty = savedProgress.algaeDirty !== undefined ? savedProgress.algaeDirty : 0;
                this.feedCooldown = savedProgress.feedCooldown || 0;
                this.gold = savedProgress.gold !== undefined ? savedProgress.gold : 50;
                if (savedProgress.equippedCosmetics) {
                    this.equippedCosmetics = savedProgress.equippedCosmetics;
                }
            } else {
                this.fish.level = 1;
                this.feedCooldown = 0;
            }
            this.updateFishScale();
            this.notifyStatusChange();
        };
        img.src = fishData.dataUrl;
    }

    loadGuestAquarium(guestFish) {
        if (!this.isGuestMode) {
            this.myOwnFishBackup = {
                fishData: this.fishData,
                fishImg: this.fishImg,
                level: this.fish.level,
                oxygen: this.oxygen,
                algaeDirty: this.algaeDirty,
                feedCooldown: this.feedCooldown,
                equippedCosmetics: { ...this.equippedCosmetics }
            };
        }

        this.isGuestMode = true;
        this.guestOwner = guestFish.creator;
        this.fishData = guestFish;

        const img = new Image();
        img.onload = () => {
            this.fishImg = img;
            this.fish.level = guestFish.level || 5;
            this.oxygen = guestFish.oxygen !== undefined ? guestFish.oxygen : 80;
            this.algaeDirty = guestFish.algaeDirty !== undefined ? guestFish.algaeDirty : 20;
            if (guestFish.equippedCosmetics) {
                this.equippedCosmetics = guestFish.equippedCosmetics;
            }
            this.updateFishScale();
            this.notifyStatusChange();
        };
        img.src = guestFish.dataUrl;
    }

    returnToMyAquarium() {
        if (!this.isGuestMode || !this.myOwnFishBackup) return;
        this.isGuestMode = false;
        this.guestOwner = null;

        const b = this.myOwnFishBackup;
        this.fishData = b.fishData;
        this.fishImg = b.fishImg;
        this.fish.level = b.level;
        this.oxygen = b.oxygen;
        this.algaeDirty = b.algaeDirty;
        this.feedCooldown = b.feedCooldown;
        this.equippedCosmetics = b.equippedCosmetics;

        this.updateFishScale();
        this.notifyStatusChange();
    }

    updateFishScale() {
        const t = (this.fish.level - 1) / (this.fish.maxLevel - 1);
        this.fish.scale = 0.55 + t * 0.8;
    }

    // Cam Silme (Bölgesel lekeye süngerle dokunarak temizleme)
    setupGlassCleaningEvents() {
        if (!this.glassCanvas) return;
        const gc = this.glassCanvas;

        const wipeAt = (clientX, clientY) => {
            const rect = gc.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            this.cleanAlgaePatchesAt(x, y, 40);

            if (Math.random() < 0.35) {
                window.soundEngine && window.soundEngine.playCleanWipe();
            }
            this.spawnCleaningBubble(x, y);

            if (this.isGuestMode && Math.random() < 0.15) {
                this.addGold(1, 'Arkadaşına Yardım');
            }
        };

        const onDown = (e) => {
            this.isWipingGlass = true;
            const p = e.touches ? e.touches[0] : e;
            wipeAt(p.clientX, p.clientY);
        };

        const onMove = (e) => {
            if (!this.isWipingGlass) return;
            const p = e.touches ? e.touches[0] : e;
            wipeAt(p.clientX, p.clientY);
        };

        const onUp = () => {
            this.isWipingGlass = false;
        };

        gc.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        gc.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);
    }

    setupFoodClickEvents() {
        this.canvas.addEventListener('click', (e) => {
            if (this.isWipingGlass) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const dist = Math.hypot(x - this.fish.x, y - this.fish.y);
            if (dist < 60 * this.fish.scale) {
                this.petFish();
            }
        });
    }

    // Bölgesel Yosun Temizliği Mantığı
    cleanAlgaePatchesAt(x, y, spongeRadius) {
        let anyCleaned = false;

        for (let i = this.algaePatches.length - 1; i >= 0; i--) {
            const patch = this.algaePatches[i];
            const dist = Math.hypot(x - patch.x, y - patch.y);

            if (dist < patch.radius + spongeRadius) {
                // Lekeyi temizle
                patch.health -= 0.18;
                anyCleaned = true;

                if (patch.health <= 0) {
                    // Leke tamamen temizlendi!
                    this.algaePatches.splice(i, 1);
                    this.addGold(2, 'Cam Temizliği');
                    window.soundEngine && window.soundEngine.playBubble(1.5);
                }
            }
        }

        if (anyCleaned) {
            this.updateAlgaePercentage();
            this.checkHealth();
            this.notifyStatusChange();
        }
    }

    spawnCleaningBubble(x, y) {
        this.cleaningParticles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            size: Math.random() * 5 + 3,
            alpha: 0.8
        });
    }

    petFish() {
        this.fish.happiness = Math.min(100, this.fish.happiness + 15);
        window.soundEngine && window.soundEngine.playBubble(1.6);

        if (this.isGuestMode) {
            window.soundEngine && window.soundEngine.playHelp();
            this.addGold(5, 'Dostça Ziyaret');
        }

        for (let i = 0; i < 4; i++) {
            this.cleaningParticles.push({
                x: this.fish.x,
                y: this.fish.y - 15,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1.5,
                size: 14,
                alpha: 1,
                isHeart: true
            });
        }
        this.notifyStatusChange();
    }

    pumpAir() {
        this.oxygen = Math.min(100, this.oxygen + 14);
        window.soundEngine && window.soundEngine.playAirPump();

        const startX = this.canvas.width * 0.15;
        const startY = this.canvas.height - 20;

        for (let i = 0; i < 18; i++) {
            this.bubbles.push({
                x: startX + (Math.random() - 0.5) * 35,
                y: startY + Math.random() * 10,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 3.5 - 2,
                size: Math.random() * 7 + 3,
                alpha: 0.7 + Math.random() * 0.3
            });
        }

        this.checkHealth();
        this.notifyStatusChange();
    }

    addGold(amount, reason = '') {
        this.gold += amount;
        window.soundEngine && window.soundEngine.playCoin();

        this.goldPopups.push({
            x: this.fish.x,
            y: this.fish.y - 30,
            text: `+${amount} 🪙`,
            alpha: 1,
            vy: -1.2
        });

        if (this.onGoldEarnedCallback) {
            this.onGoldEarnedCallback(this.gold, amount, reason);
        }
        this.notifyStatusChange();
    }

    equipCosmetic(type, id) {
        if (this.equippedCosmetics[type] !== undefined) {
            this.equippedCosmetics[type] = id;
            window.soundEngine && window.soundEngine.playBuy();
            this.notifyStatusChange();
        }
    }

    feedFish() {
        if (this.feedCooldown > 0 || this.isGuestMode) return false;

        const pelletX = this.canvas.width * (0.3 + Math.random() * 0.4);
        this.foodPellets.push({
            x: pelletX,
            y: 10,
            vy: 1.5,
            size: 6,
            eaten: false
        });

        this.feedCooldown = this.isFastTestMode ? 5 : this.feedCooldownMax;
        this.fish.targetX = pelletX;
        this.fish.targetY = 40;

        window.soundEngine && window.soundEngine.playBubble(1.1);
        this.notifyStatusChange();
        return true;
    }

    toggleFastTestMode(enable) {
        this.isFastTestMode = enable !== undefined ? enable : !this.isFastTestMode;
        if (this.isFastTestMode && this.feedCooldown > 5) {
            this.feedCooldown = 5;
        }
        return this.isFastTestMode;
    }

    checkHealth() {
        const wasSick = this.fish.isSick;
        if (this.oxygen < 25 || this.algaeDirty > 70) {
            this.fish.isSick = true;
            this.fish.health = Math.max(20, this.fish.health - 0.2);
        } else {
            this.fish.isSick = false;
            this.fish.health = Math.min(100, this.fish.health + 0.5);
        }

        if (wasSick !== this.fish.isSick) {
            this.notifyStatusChange();
        }
    }

    onPelletEaten() {
        window.soundEngine && window.soundEngine.playEat();

        if (!this.fish.isSick && this.fish.level < this.fish.maxLevel) {
            this.fish.level++;
            this.updateFishScale();
            window.soundEngine && window.soundEngine.playLevelUp();

            this.addGold(15, 'Beslenme Bonusu');

            if (this.onLevelUpCallback) {
                this.onLevelUpCallback(this.fish.level);
            }

            if (this.fish.level >= this.fish.maxLevel) {
                window.soundEngine && window.soundEngine.playFullGrownChime();
                if (this.onFullGrownCallback) {
                    this.onFullGrownCallback();
                }
            }
        }
        this.notifyStatusChange();
    }

    releaseToOcean() {
        if (this.fish.level < this.fish.maxLevel) return null;

        this.isAscending = true;
        window.soundEngine && window.soundEngine.playAscension();

        this.fish.targetX = this.canvas.width + 150;
        this.fish.targetY = this.canvas.height * 0.4;
        this.fish.facingRight = true;

        const releasedFish = {
            ...this.fishData,
            releasedAt: Date.now(),
            level: this.fish.level,
            finalScale: this.fish.scale,
            equippedCosmetics: { ...this.equippedCosmetics }
        };

        this.addGold(100, 'Okyanusa Ulaşma');

        setTimeout(() => {
            if (this.onReleaseCallback) {
                this.onReleaseCallback(releasedFish);
            }
        }, 2200);

        return releasedFish;
    }

    resetAquarium() {
        this.fishData = null;
        this.fishImg = null;
        this.isAscending = false;
        this.fish.level = 1;
        this.fish.isSick = false;
        this.fish.health = 100;
        this.oxygen = 85;
        this.feedCooldown = 0;
        this.algaePatches = [];
        this.algaeDirty = 0;
        this.spawnAlgaePatch();
        this.notifyStatusChange();
    }

    notifyStatusChange() {
        if (this.onStatusChangeCallback) {
            this.onStatusChangeCallback({
                level: this.fish.level,
                maxLevel: this.fish.maxLevel,
                oxygen: Math.round(this.oxygen),
                algaeDirty: this.algaeDirty,
                algaePatchCount: this.algaePatches.length,
                feedCooldown: Math.ceil(this.feedCooldown),
                isSick: this.fish.isSick,
                isFullGrown: this.fish.level >= this.fish.maxLevel,
                isFastTestMode: this.isFastTestMode,
                gold: this.gold,
                afkSecondsRemaining: Math.ceil(this.afkFarmInterval - this.afkFarmTimer),
                isGuestMode: this.isGuestMode,
                guestOwner: this.guestOwner,
                equippedCosmetics: this.equippedCosmetics,
                name: this.fishData ? this.fishData.name : '',
                creator: this.fishData ? this.fishData.creator : ''
            });
        }
    }

    startLoop() {
        const loop = (currentTime) => {
            const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;

            this.update(dt);
            this.render();

            this.animFrame = requestAnimationFrame(loop);
        };
        this.animFrame = requestAnimationFrame(loop);
    }

    update(dt) {
        if (!this.isGuestMode) {
            // Oksijen yavaşça düşer
            this.oxygen = Math.max(0, this.oxygen - dt * 0.4);

            // Bölgesel Yosunlaşma Zamanlayıcısı (Sürekli değil, belirli aralıklarla)
            const interval = this.isFastTestMode ? 10 : this.algaeSpawnInterval;
            this.algaeSpawnTimer += dt;
            if (this.algaeSpawnTimer >= interval) {
                this.algaeSpawnTimer = 0;
                this.spawnAlgaePatch();
            }

            if (this.feedCooldown > 0) {
                this.feedCooldown = Math.max(0, this.feedCooldown - dt);
                if (this.feedCooldown === 0) {
                    window.soundEngine && window.soundEngine.playBubble(1.8);
                    this.notifyStatusChange();
                }
            }

            // AFK Gold Farm: Balık sağlıklıysa her dakika altın kazandırır
            if (this.fishImg && !this.fish.isSick) {
                this.afkFarmTimer += dt;
                if (this.afkFarmTimer >= this.afkFarmInterval) {
                    this.afkFarmTimer = 0;
                    this.addGold(this.goldPerTick, 'AFK Farm');
                }
            }
        }

        this.checkHealth();

        for (let i = this.foodPellets.length - 1; i >= 0; i--) {
            const p = this.foodPellets[i];
            p.y += p.vy;

            const d = Math.hypot(this.fish.x - p.x, this.fish.y - p.y);
            if (d < 35 * this.fish.scale) {
                this.foodPellets.splice(i, 1);
                this.onPelletEaten();
                continue;
            }

            if (p.y > this.canvas.height - 25) {
                this.foodPellets.splice(i, 1);
            }
        }

        this.updateFishMovement(dt);
        this.updateCosmeticTrails(dt);
        this.updateParticles(dt);
        this.updateGoldPopups(dt);
    }

    updateFishMovement(dt) {
        if (!this.fishImg) return;

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.fish.wiggleTimer += dt * (this.fish.isSick ? 2 : 4.5);

        if (this.isAscending) {
            this.fish.x += dt * 320;
            this.fish.y += Math.sin(this.fish.wiggleTimer * 2) * 1.5;
            this.fish.facingRight = true;
            return;
        }

        if (this.foodPellets.length > 0) {
            const closest = this.foodPellets[0];
            this.fish.targetX = closest.x;
            this.fish.targetY = closest.y;
        } else {
            if (Math.hypot(this.fish.targetX - this.fish.x, this.fish.targetY - this.fish.y) < 30 || Math.random() < 0.015) {
                this.fish.targetX = 80 + Math.random() * (w - 160);
                this.fish.targetY = 70 + Math.random() * (h - 180);
            }
        }

        const dx = this.fish.targetX - this.fish.x;
        const dy = this.fish.targetY - this.fish.y;
        const speed = this.fish.isSick ? 45 : (this.foodPellets.length > 0 ? 160 : 85);
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            this.fish.vx = (dx / dist) * speed;
            this.fish.vy = (dy / dist) * speed;
            this.fish.x += this.fish.vx * dt;
            this.fish.y += this.fish.vy * dt;

            if (Math.abs(this.fish.vx) > 5) {
                this.fish.facingRight = this.fish.vx > 0;
            }

            this.emitSwimTrailParticle();
        }

        if (Math.random() < 0.03 && !this.fish.isSick) {
            this.bubbles.push({
                x: this.fish.facingRight ? this.fish.x + 25 * this.fish.scale : this.fish.x - 25 * this.fish.scale,
                y: this.fish.y,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -Math.random() * 2 - 1,
                size: Math.random() * 4 + 2,
                alpha: 0.6
            });
        }
    }

    emitSwimTrailParticle() {
        const trailType = this.equippedCosmetics.trail || 'default';
        const tailX = this.fish.facingRight ? this.fish.x - 30 * this.fish.scale : this.fish.x + 30 * this.fish.scale;
        const tailY = this.fish.y + Math.sin(this.fish.wiggleTimer) * 4;

        this.swimTrails.push({
            x: tailX,
            y: tailY,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size: Math.random() * 4 + 3,
            alpha: 0.8,
            life: 1.0,
            type: trailType,
            colorSeed: Math.random()
        });
    }

    updateCosmeticTrails(dt) {
        for (let i = this.swimTrails.length - 1; i >= 0; i--) {
            const p = this.swimTrails[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt * 1.5;
            p.alpha = Math.max(0, p.life);

            if (p.life <= 0) {
                this.swimTrails.splice(i, 1);
            }
        }
    }

    updateGoldPopups(dt) {
        for (let i = this.goldPopups.length - 1; i >= 0; i--) {
            const pop = this.goldPopups[i];
            pop.y += pop.vy;
            pop.alpha -= dt * 0.8;
            if (pop.alpha <= 0) {
                this.goldPopups.splice(i, 1);
            }
        }
    }

    updateParticles(dt) {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.x += b.vx;
            b.y += b.vy;
            if (b.y < -10) {
                this.bubbles.splice(i, 1);
            }
        }

        for (let i = this.cleaningParticles.length - 1; i >= 0; i--) {
            const p = this.cleaningParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= dt * 1.2;
            if (p.alpha <= 0 || p.y < -20) {
                this.cleaningParticles.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. FishVille Akvaryum Arka Planı (Turkuaz Berrak Su & Kaya Kemeri)
        this.renderFishVilleBackground(ctx, w, h);

        // 2. Yem Peletleri
        for (const p of this.foodPellets) {
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffeaa7';
            ctx.beginPath();
            ctx.arc(p.x - 2, p.y - 2, p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Kabarcıklar
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (const b of this.bubbles) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        }

        // 4. Yüzme İzi
        this.renderSwimTrails(ctx);

        // 5. Balık Çizimi
        this.renderFish(ctx);

        // 6. Camdaki Bölgesel Yosun Lekeleri (Regional Algae Patches)
        this.renderAlgaePatches(ctx);

        // 7. Akvaryum Cam Kenar Parıltıları (FishVille Cam Akvaryum Hissi)
        this.renderAquariumGlassFrame(ctx, w, h);

        // 8. Temizleme Partikülleri ve Kalpler
        for (const p of this.cleaningParticles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            if (p.isHeart) {
                ctx.fillStyle = '#ff4081';
                ctx.font = `${p.size}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('❤️', p.x, p.y);
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 9. Altın Popupları
        for (const pop of this.goldPopups) {
            ctx.save();
            ctx.globalAlpha = pop.alpha;
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 6;
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        }

        if (this.isAscending) {
            this.renderAscensionPortal(ctx, w, h);
        }
    }

    // FishVille Tarzı Akvaryum Arka Planı (Turkuaz Su, Derin Mavi Kaya Kemeri, Sıcak Kum)
    renderFishVilleBackground(ctx, w, h) {
        // 1. Berrak Turkuaz Su Gradienti
        const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
        waterGrad.addColorStop(0, '#38c5d9');   // Parlak üst turkuaz
        waterGrad.addColorStop(0.4, '#24a1b8'); // Canlı deniz mavisi
        waterGrad.addColorStop(0.8, '#1b7a91'); // Derin su mavisi
        waterGrad.addColorStop(1, '#135c6e');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, 0, w, h);

        // Güneş Işığı Huzmeleri (Caustic Rays)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 5; i++) {
            const rx = w * (0.15 + i * 0.2);
            ctx.beginPath();
            ctx.moveTo(rx, 0);
            ctx.lineTo(rx + 80, h);
            ctx.lineTo(rx + 140, h);
            ctx.lineTo(rx + 30, 0);
            ctx.fill();
        }
        ctx.restore();

        // 2. Uzaktaki Mavi/Mor Çizgi Kaya Oluşumları & Kaya Kemeri (Fotoğraftaki gibi)
        ctx.save();
        const sandHeight = 110;
        const sandTop = h - sandHeight;

        // Sol Taraftaki Kemerli Mağara Kayası (FishVille İkonik Kemeri)
        ctx.fillStyle = '#2c4373';
        ctx.beginPath();
        ctx.moveTo(0, sandTop);
        ctx.lineTo(0, h * 0.35);
        ctx.quadraticCurveTo(w * 0.08, h * 0.12, w * 0.18, h * 0.08); // Üst tepe
        ctx.quadraticCurveTo(w * 0.28, h * 0.1, w * 0.35, h * 0.3);
        ctx.quadraticCurveTo(w * 0.42, h * 0.45, w * 0.46, sandTop);
        ctx.closePath();
        ctx.fill();

        // Kemer Deliği (Arch Hole)
        ctx.fillStyle = '#24a1b8';
        ctx.beginPath();
        ctx.ellipse(w * 0.18, h * 0.32, w * 0.07, h * 0.11, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Sağ Taraftaki Yüksek Resif Kayaları
        ctx.fillStyle = '#253a66';
        ctx.beginPath();
        ctx.moveTo(w * 0.65, sandTop);
        ctx.lineTo(w * 0.72, h * 0.28);
        ctx.quadraticCurveTo(w * 0.78, h * 0.14, w * 0.85, h * 0.06); // Zirve
        ctx.quadraticCurveTo(w * 0.92, h * 0.15, w, h * 0.22);
        ctx.lineTo(w, sandTop);
        ctx.closePath();
        ctx.fill();

        // 3. Kayaların Üzerindeki Canlı Yosunlar ve Mercanlar
        ctx.strokeStyle = '#1e7539';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        // Sol kemer üstü yosunlar
        ctx.beginPath();
        ctx.moveTo(w * 0.08, h * 0.35);
        ctx.quadraticCurveTo(w * 0.07, h * 0.22, w * 0.09, h * 0.16);
        ctx.moveTo(w * 0.3, h * 0.38);
        ctx.quadraticCurveTo(w * 0.32, h * 0.25, w * 0.31, h * 0.18);
        // Sağ kayalık yosunları
        ctx.moveTo(w * 0.88, h * 0.32);
        ctx.quadraticCurveTo(w * 0.9, h * 0.2, w * 0.89, h * 0.12);
        ctx.stroke();

        // Pembe/Mor Mercanlar
        ctx.fillStyle = '#e84393';
        ctx.beginPath();
        ctx.arc(w * 0.07, h * 0.38, 14, 0, Math.PI * 2);
        ctx.arc(w * 0.33, h * 0.42, 12, 0, Math.PI * 2);
        ctx.fill();

        // 4. Sıcak Kumlu Zemin (FishVille Sıcak Bej Kumu)
        const sandGrad = ctx.createLinearGradient(0, sandTop, 0, h);
        sandGrad.addColorStop(0, '#e5d1a4');
        sandGrad.addColorStop(0.5, '#dfc488');
        sandGrad.addColorStop(1, '#caa765');
        ctx.fillStyle = sandGrad;

        ctx.beginPath();
        ctx.moveTo(0, sandTop + 15);
        ctx.quadraticCurveTo(w * 0.25, sandTop - 8, w * 0.5, sandTop + 8);
        ctx.quadraticCurveTo(w * 0.75, sandTop + 20, w, sandTop);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Kum Üzerindeki Çakıl Taşları ve Deniz Kabukları
        ctx.fillStyle = 'rgba(180, 150, 100, 0.6)';
        for (let i = 0; i < 16; i++) {
            const px = (w * (i * 0.065)) + ((i % 3) * 12);
            const py = sandTop + 35 + ((i % 4) * 16);
            ctx.beginPath();
            ctx.ellipse(px, py, 6 + (i % 4), 3 + (i % 2), (i % 3) * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Camdaki Bölgesel Yosun Lekeleri (Bölgesel, Şeffaf ve Organik)
    renderAlgaePatches(ctx) {
        if (this.algaePatches.length === 0) return;

        ctx.save();
        for (const patch of this.algaePatches) {
            const r = patch.radius * patch.health;
            if (r <= 2) continue;

            // Dış yumuşak yosun halkası
            const grad = ctx.createRadialGradient(patch.x, patch.y, 4, patch.x, patch.y, r);
            grad.addColorStop(0, `rgba(46, 125, 50, ${0.75 * patch.health})`);
            grad.addColorStop(0.6, `rgba(67, 160, 71, ${0.5 * patch.health})`);
            grad.addColorStop(1, 'rgba(102, 187, 106, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(patch.x, patch.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Yosunun içinde minik organik noktacıklar
            ctx.fillStyle = `rgba(27, 94, 32, ${0.65 * patch.health})`;
            for (let i = 0; i < 5; i++) {
                const ox = Math.cos(patch.wiggleOffset + i * 1.2) * (r * 0.45);
                const oy = Math.sin(patch.wiggleOffset + i * 1.2) * (r * 0.45);
                ctx.beginPath();
                ctx.arc(patch.x + ox, patch.y + oy, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Temizleme ipucu halkası
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * patch.health})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(patch.x, patch.y, r + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.restore();
    }

    // Akvaryum Cam Çerçevesi ve 3D Köşe Yansımaları
    renderAquariumGlassFrame(ctx, w, h) {
        ctx.save();
        // Sol ve Sağ Cam Köşe Yansımaları
        const leftGrad = ctx.createLinearGradient(0, 0, 35, 0);
        leftGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        leftGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.15)');
        leftGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, 35, h);

        const rightGrad = ctx.createLinearGradient(w, 0, w - 35, 0);
        rightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        rightGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.12)');
        rightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(w - 35, 0, 35, h);

        // Üst Su Çizgisi Işıltısı
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(w, 4);
        ctx.stroke();

        ctx.restore();
    }

    renderSwimTrails(ctx) {
        for (const p of this.swimTrails) {
            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'kick_neon') {
                ctx.fillStyle = '#53FC18';
                ctx.shadowColor = '#53FC18';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'stars') {
                ctx.fillStyle = '#ffd700';
                ctx.font = `${Math.round(p.size * 2)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('✨', p.x, p.y);
            } else if (p.type === 'gold_dust') {
                ctx.fillStyle = '#ffb300';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'rainbow') {
                const hue = Math.round(p.colorSeed * 360);
                ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    renderFish(ctx) {
        if (!this.fishImg) return;

        const f = this.fish;
        ctx.save();
        ctx.translate(f.x, f.y);

        const dir = f.facingRight ? 1 : -1;
        ctx.scale(dir * f.scale, f.scale);

        const wiggle = Math.sin(f.wiggleTimer) * 0.08;
        const bob = Math.cos(f.wiggleTimer * 0.5) * 3;
        ctx.translate(0, bob);
        ctx.rotate(wiggle);

        if (f.level >= f.maxLevel) {
            ctx.shadowColor = '#53FC18';
            ctx.shadowBlur = 25;
        }

        if (f.isSick) {
            ctx.filter = 'grayscale(80%) opacity(75%)';
        }

        const fw = this.fishData.width;
        const fh = this.fishData.height;
        const segments = 8;
        const sliceW = fw / segments;

        for (let i = 0; i < segments; i++) {
            const sx = i * sliceW;
            const tailWeight = (segments - i) / segments;
            const sliceWiggle = Math.sin(f.wiggleTimer - i * 0.45) * 7 * tailWeight;

            ctx.drawImage(
                this.fishImg,
                sx, 0, sliceW, fh,
                -fw / 2 + sx, -fh / 2 + sliceWiggle, sliceW, fh
            );
        }

        ctx.restore();
        this.renderFishStatusBadge(ctx);
    }

    renderFishStatusBadge(ctx) {
        const f = this.fish;
        const badgeY = f.y - (this.fishData ? this.fishData.height * 0.5 * f.scale : 40) - 20;

        ctx.save();
        ctx.textAlign = 'center';

        if (this.isGuestMode) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(`👀 ${this.fishData.name} (@${this.guestOwner}'ın Akvaryumu)`, f.x, badgeY);
        } else if (f.isSick) {
            ctx.fillStyle = '#ff4757';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText('🩹 HASTA (Lekeleri silin, oksijen basın!)', f.x, badgeY);
        } else if (f.level >= f.maxLevel) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.fillText('🌟 Okyanusa Hazır!', f.x, badgeY);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(`${this.fishData.name} (Lv. ${f.level}/${f.maxLevel})`, f.x, badgeY);
        }

        ctx.restore();
    }

    renderAscensionPortal(ctx, w, h) {
        ctx.save();
        const portalX = w - 40;
        const portalY = h * 0.4;

        const grad = ctx.createRadialGradient(portalX, portalY, 10, portalX, portalY, 140);
        grad.addColorStop(0, 'rgba(83, 252, 24, 0.85)');
        grad.addColorStop(0.5, 'rgba(0, 229, 255, 0.5)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(portalX, portalY, 140, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText('OKYANUSA SALINIYOR...', w / 2, h * 0.2);
        ctx.restore();
    }
}

window.PersonalAquarium = PersonalAquarium;
