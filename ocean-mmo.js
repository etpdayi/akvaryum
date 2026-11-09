/**
 * Akvaryum - Ortak Okyanus (MMO Canlı Yayın & Topluluk Okyanusu)
 * FishVille tarzı berrak turkuaz su, resifler, batık korsan sandığı ve tüm izleyici balıkları.
 */

class SharedOcean {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.fishes = [];
        this.fishImages = new Map();
        this.foodPellets = [];
        this.bubbles = [];
        this.announcements = [];

        this.lastTime = performance.now();
        this.oceanTime = 0;
        this.animFrame = null;

        this.seaweeds = [];
        this.initDecorations();

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInteractivity();
        this.startLoop();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initDecorations();
    }

    initDecorations() {
        if (!this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.seaweeds = [];
        const count = Math.floor(w / 100);
        for (let i = 0; i < count; i++) {
            this.seaweeds.push({
                x: i * 100 + Math.random() * 40,
                y: h - 10,
                height: 120 + Math.random() * 150,
                color: i % 2 === 0 ? '#1b7a3e' : '#145c2e',
                offset: Math.random() * Math.PI * 2
            });
        }
    }

    setupInteractivity() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.dropFood(x, y);
            window.soundEngine && window.soundEngine.playBubble(1.3);
        });
    }

    dropFood(x, y) {
        for (let i = 0; i < 4; i++) {
            this.foodPellets.push({
                x: x + (Math.random() - 0.5) * 25,
                y: y + (Math.random() - 0.5) * 20,
                vy: 1.2 + Math.random() * 0.8,
                size: 5
            });
        }
    }

    addFish(fishData, isNewArrival = false) {
        const exists = this.fishes.find(f => f.id === fishData.id);
        if (exists) return;

        let img = this.fishImages.get(fishData.dataUrl);
        if (!img) {
            img = new Image();
            img.src = fishData.dataUrl;
            this.fishImages.set(fishData.dataUrl, img);
        }

        const w = this.canvas.width || 1200;
        const h = this.canvas.height || 700;
        const depth = 0.65 + Math.random() * 0.55;

        const newFish = {
            id: fishData.id,
            name: fishData.name || 'İsimsiz Balık',
            creator: fishData.creator || 'Gizli Yüzücü',
            img: img,
            width: fishData.width || 120,
            height: fishData.height || 80,
            depth: depth,
            scale: (fishData.finalScale || 0.9) * depth,
            x: isNewArrival ? -100 : Math.random() * (w - 200) + 100,
            y: isNewArrival ? h * 0.35 : Math.random() * (h - 250) + 80,
            targetX: Math.random() * w,
            targetY: Math.random() * h,
            vx: 0,
            vy: 0,
            baseSpeed: (45 + Math.random() * 50) * depth,
            wiggleTimer: Math.random() * 10,
            facingRight: true,
            isNewArrival: isNewArrival,
            arrivalTimer: isNewArrival ? 3.5 : 0
        };

        this.fishes.push(newFish);

        if (isNewArrival) {
            this.triggerArrivalCelebration(newFish);
        }
    }

    triggerArrivalCelebration(fish) {
        window.soundEngine && window.soundEngine.playAscension();

        this.announcements.push({
            id: 'ann_' + Date.now(),
            text: `🎉 @${fish.creator}, "${fish.name}" isimli balığıyla Okyanusa Katıldı! 🌊`,
            subText: `Ortak akvaryumda diğer tüm balıklarla birlikte yüzüyor!`,
            timer: 7.0,
            alpha: 1
        });

        for (let i = 0; i < 40; i++) {
            this.bubbles.push({
                x: 100 + Math.random() * 200,
                y: this.canvas.height - 20,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 5 - 3,
                size: Math.random() * 8 + 4,
                alpha: 0.8
            });
        }
    }

    startLoop() {
        const loop = (currentTime) => {
            const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;
            this.oceanTime += dt;

            this.update(dt);
            this.render();

            this.animFrame = requestAnimationFrame(loop);
        };
        this.animFrame = requestAnimationFrame(loop);
    }

    update(dt) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (const f of this.fishes) {
            f.wiggleTimer += dt * 3.5;

            if (f.arrivalTimer > 0) {
                f.arrivalTimer -= dt;
            }

            if (this.foodPellets.length > 0) {
                let closest = null;
                let minDist = 400;
                for (const p of this.foodPellets) {
                    const d = Math.hypot(p.x - f.x, p.y - f.y);
                    if (d < minDist) {
                        minDist = d;
                        closest = p;
                    }
                }
                if (closest) {
                    f.targetX = closest.x;
                    f.targetY = closest.y;
                }
            } else if (Math.hypot(f.targetX - f.x, f.targetY - f.y) < 50 || Math.random() < 0.008) {
                f.targetX = 60 + Math.random() * (w - 120);
                f.targetY = 60 + Math.random() * (h - 180);
            }

            const dx = f.targetX - f.x;
            const dy = f.targetY - f.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 8) {
                const speed = f.baseSpeed * (this.foodPellets.length > 0 ? 1.8 : 1);
                f.vx = (dx / dist) * speed;
                f.vy = (dy / dist) * speed;
                f.x += f.vx * dt;
                f.y += f.vy * dt;

                if (Math.abs(f.vx) > 3) {
                    f.facingRight = f.vx > 0;
                }
            }
        }

        for (let i = this.foodPellets.length - 1; i >= 0; i--) {
            const p = this.foodPellets[i];
            p.y += p.vy;

            for (const f of this.fishes) {
                if (Math.hypot(f.x - p.x, f.y - p.y) < 35 * f.scale) {
                    this.foodPellets.splice(i, 1);
                    window.soundEngine && window.soundEngine.playEat();
                    break;
                }
            }

            if (p && p.y > h - 30) {
                this.foodPellets.splice(i, 1);
            }
        }

        if (Math.random() < 0.25) {
            this.bubbles.push({
                x: Math.random() * w,
                y: h + 10,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -Math.random() * 2.5 - 1.2,
                size: Math.random() * 5 + 2,
                alpha: 0.6
            });
        }

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.x += b.vx;
            b.y += b.vy;
            if (b.y < -20) {
                this.bubbles.splice(i, 1);
            }
        }

        for (let i = this.announcements.length - 1; i >= 0; i--) {
            const a = this.announcements[i];
            a.timer -= dt;
            if (a.timer < 1.0) {
                a.alpha = Math.max(0, a.timer);
            }
            if (a.timer <= 0) {
                this.announcements.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Berrak Turkuaz Su & FishVille Okyanus Arka Planı
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
        oceanGrad.addColorStop(0, '#32b8cc');
        oceanGrad.addColorStop(0.5, '#2298ad');
        oceanGrad.addColorStop(0.85, '#177487');
        oceanGrad.addColorStop(1, '#115261');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, w, h);

        // Güneş Huzmeleri
        ctx.save();
        for (let i = 0; i < 5; i++) {
            const rayX = (w * (0.15 + i * 0.2)) + Math.sin(this.oceanTime * 0.5 + i) * 35;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.moveTo(rayX, 0);
            ctx.lineTo(rayX + 90, h);
            ctx.lineTo(rayX + 170, h);
            ctx.lineTo(rayX + 40, 0);
            ctx.fill();
        }
        ctx.restore();

        // 2. Uzak Resif Kayaları (FishVille Mor/Mavi Kayalıklar)
        ctx.save();
        const sandH = 100;
        ctx.fillStyle = '#263d6b';
        ctx.beginPath();
        ctx.moveTo(0, h - sandH);
        ctx.lineTo(0, h * 0.38);
        ctx.quadraticCurveTo(w * 0.1, h * 0.15, w * 0.22, h * 0.1);
        ctx.quadraticCurveTo(w * 0.32, h * 0.12, w * 0.42, h - sandH);
        ctx.lineTo(w * 0.6, h - sandH);
        ctx.quadraticCurveTo(w * 0.75, h * 0.18, w * 0.88, h * 0.08);
        ctx.quadraticCurveTo(w * 0.95, h * 0.18, w, h * 0.3);
        ctx.lineTo(w, h - sandH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 3. Sıcak Kumlu Zemin
        ctx.save();
        const sandGrad = ctx.createLinearGradient(0, h - sandH, 0, h);
        sandGrad.addColorStop(0, '#e5d1a4');
        sandGrad.addColorStop(0.5, '#dfc488');
        sandGrad.addColorStop(1, '#caa765');
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, h - sandH + 10);
        ctx.quadraticCurveTo(w * 0.25, h - sandH - 10, w * 0.5, h - sandH + 8);
        ctx.quadraticCurveTo(w * 0.75, h - sandH + 18, w, h - sandH);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 4. Salınan Deniz Yosunları
        this.renderSeaweeds(ctx, h);

        // 5. Yemler
        for (const p of this.foodPellets) {
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 6. Kabarcıklar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        for (const b of this.bubbles) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // 7. Balıklar (Derinlik sırasına göre)
        const sortedFishes = [...this.fishes].sort((a, b) => a.depth - b.depth);
        for (const f of sortedFishes) {
            this.renderOceanFish(ctx, f);
        }

        // 8. Duyuru Banner'ı
        this.renderAnnouncements(ctx, w, h);
    }

    renderSeaweeds(ctx, h) {
        ctx.save();
        for (const s of this.seaweeds) {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);

            const sway = Math.sin(this.oceanTime * 1.5 + s.offset) * 20;
            ctx.bezierCurveTo(
                s.x - sway * 0.4, s.y - s.height * 0.4,
                s.x + sway, s.y - s.height * 0.7,
                s.x + sway * 1.2, s.y - s.height
            );
            ctx.stroke();
        }
        ctx.restore();
    }

    renderOceanFish(ctx, f) {
        if (!f.img || !f.img.complete) return;

        ctx.save();
        ctx.translate(f.x, f.y);

        ctx.globalAlpha = Math.min(1.0, 0.75 + f.depth * 0.25);

        const dir = f.facingRight ? 1 : -1;
        ctx.scale(dir * f.scale, f.scale);

        const wiggle = Math.sin(f.wiggleTimer) * 0.08;
        const bob = Math.cos(f.wiggleTimer * 0.6) * 3;
        ctx.translate(0, bob);
        ctx.rotate(wiggle);

        if (f.arrivalTimer > 0) {
            ctx.shadowColor = '#53FC18';
            ctx.shadowBlur = 30;
        }

        const fw = f.width;
        const fh = f.height;
        const segments = 8;
        const sliceW = fw / segments;

        for (let i = 0; i < segments; i++) {
            const sx = i * sliceW;
            const tailWeight = (segments - i) / segments;
            const sliceWiggle = Math.sin(f.wiggleTimer - i * 0.45) * 6 * tailWeight;

            ctx.drawImage(
                f.img,
                sx, 0, sliceW, fh,
                -fw / 2 + sx, -fh / 2 + sliceWiggle, sliceW, fh
            );
        }

        ctx.restore();

        // Balık Üstü Etiket
        ctx.save();
        ctx.textAlign = 'center';
        const labelY = f.y - (f.height * 0.5 * f.scale) - 14;

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(11, Math.round(12 * f.depth))}px Inter, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(f.name, f.x, labelY);

        ctx.fillStyle = '#53FC18';
        ctx.font = `bold ${Math.max(10, Math.round(11 * f.depth))}px Inter, sans-serif`;
        ctx.fillText(`@${f.creator}`, f.x, labelY + 13);

        ctx.restore();
    }

    renderAnnouncements(ctx, w, h) {
        if (this.announcements.length === 0) return;

        const a = this.announcements[0];
        ctx.save();
        ctx.globalAlpha = a.alpha;

        const boxW = Math.min(680, w * 0.88);
        const boxH = 75;
        const boxX = (w - boxW) / 2;
        const boxY = 40;

        ctx.fillStyle = 'rgba(10, 35, 60, 0.95)';
        ctx.strokeStyle = '#53FC18';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;

        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 16);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(a.text, w / 2, boxY + 33);

        ctx.fillStyle = '#53FC18';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText(a.subText, w / 2, boxY + 57);

        ctx.restore();
    }

    loadStarterCommunityFish() {
        if (this.fishes.length > 0) return;

        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 300;
        dummyCanvas.height = 180;
        const dCtx = dummyCanvas.getContext('2d');

        // Balık 1
        dCtx.strokeStyle = '#53FC18';
        dCtx.lineWidth = 10;
        dCtx.beginPath();
        dCtx.ellipse(150, 90, 70, 45, 0, 0, Math.PI * 2);
        dCtx.stroke();
        dCtx.fillStyle = '#fff';
        dCtx.beginPath();
        dCtx.arc(180, 80, 6, 0, Math.PI * 2);
        dCtx.fill();

        this.addFish({
            id: 'starter_0',
            name: 'Korsan Neon',
            creator: 'pristagna',
            dataUrl: dummyCanvas.toDataURL(),
            width: 300,
            height: 180,
            finalScale: 0.95
        }, false);
    }
}

window.SharedOcean = SharedOcean;
