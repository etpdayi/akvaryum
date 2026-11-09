/**
 * Pristagna Akvaryum - Balık Çizim ve Yaratım Motoru
 * Kullanıcının hayal gücüyle çizdiği balığı canlı 2D yüzme sprite'ına dönüştürür.
 */

class FishDrawingCanvas {
    constructor(canvasId, previewCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById(previewCanvasId);
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

        this.isDrawing = false;
        this.currentColor = '#53FC18'; // Kick Green
        this.currentSize = 8;
        this.currentTool = 'brush'; // 'brush' | 'neon' | 'eraser'
        this.history = [];
        this.maxHistory = 25;
        this.showGuide = true;

        this.previewFish = null;
        this.previewAnimFrame = null;
        this.previewTime = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.saveState();
        this.drawGuide();
        this.startPreviewAnimation();
    }

    setupEventListeners() {
        const c = this.canvas;

        const getPos = (e) => {
            const rect = c.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const scaleX = c.width / rect.width;
            const scaleY = c.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const startDraw = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);
            this.lastX = pos.x;
            this.lastY = pos.y;

            this.drawDot(pos.x, pos.y);
            window.soundEngine && window.soundEngine.ensureContext();
        };

        const moveDraw = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            this.drawLine(this.lastX, this.lastY, pos.x, pos.y);
            this.lastX = pos.x;
            this.lastY = pos.y;
            this.updatePreviewImage();
        };

        const endDraw = (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.saveState();
            this.updatePreviewImage();
        };

        c.addEventListener('mousedown', startDraw);
        window.addEventListener('mousemove', moveDraw);
        window.addEventListener('mouseup', endDraw);

        c.addEventListener('touchstart', startDraw, { passive: false });
        window.addEventListener('touchmove', moveDraw, { passive: false });
        window.addEventListener('touchend', endDraw);
    }

    setTool(tool) {
        this.currentTool = tool;
    }

    setColor(color) {
        this.currentColor = color;
        if (this.currentTool === 'eraser') {
            this.currentTool = 'brush';
        }
    }

    setSize(size) {
        this.currentSize = parseInt(size, 10);
    }

    toggleGuide(show) {
        this.showGuide = show !== undefined ? show : !this.showGuide;
        this.redrawCanvas();
    }

    drawDot(x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, this.currentSize / 2, 0, Math.PI * 2);

        if (this.currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000000';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = this.currentColor;
            if (this.currentTool === 'neon') {
                ctx.shadowColor = this.currentColor;
                ctx.shadowBlur = 15;
            }
        }
        ctx.fill();
        ctx.restore();
    }

    drawLine(x1, y1, x2, y2) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = this.currentSize;

        if (this.currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = '#000000';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = this.currentColor;
            if (this.currentTool === 'neon') {
                ctx.shadowColor = this.currentColor;
                ctx.shadowBlur = 18;
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    saveState() {
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }

    undo() {
        if (this.history.length > 1) {
            this.history.pop(); // Mevcut durumu at
            const prevState = this.history[this.history.length - 1];
            this.ctx.putImageData(prevState, 0, 0);
            this.updatePreviewImage();
        } else if (this.history.length === 1) {
            this.clear(false);
        }
    }

    clear(save = true) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (save) {
            this.history = [];
            this.saveState();
        }
        this.updatePreviewImage();
    }

    drawGuide() {
        // Tuvalin arka planına rehber balık silueti çizer (Canvas'a değil, CSS veya altına)
        // Ancak kullanıcı isterse canvas temizken şablon balık ekleyebiliriz.
    }

    redrawCanvas() {
        if (this.history.length > 0) {
            this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
        }
    }

    // Kullanıcıya ilham vermek için hazır şablon balık çizer
    loadTemplate(type = 'fish') {
        this.clear(false);
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (type === 'fish') {
            // Neon Kick Balığı
            ctx.strokeStyle = '#53FC18';
            ctx.lineWidth = 10;
            ctx.shadowColor = '#53FC18';
            ctx.shadowBlur = 12;

            // Balık Gövdesi
            ctx.beginPath();
            ctx.moveTo(cx + 120, cy); // Burun
            ctx.quadraticCurveTo(cx, cy - 80, cx - 80, cy - 20); // Sırt
            ctx.lineTo(cx - 150, cy - 70); // Üst kuyruk
            ctx.quadraticCurveTo(cx - 120, cy, cx - 150, cy + 70); // Kuyruk çatalı
            ctx.lineTo(cx - 80, cy + 20); // Alt kuyruk
            ctx.quadraticCurveTo(cx, cy + 80, cx + 120, cy); // Karın
            ctx.stroke();

            // Göz
            ctx.beginPath();
            ctx.arc(cx + 80, cy - 15, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 0;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 82, cy - 15, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            // Yüzgeç ve Solungaç
            ctx.beginPath();
            ctx.strokeStyle = '#00E5FF';
            ctx.shadowColor = '#00E5FF';
            ctx.lineWidth = 6;
            ctx.moveTo(cx + 40, cy - 30);
            ctx.quadraticCurveTo(cx + 25, cy, cx + 40, cy + 30);
            ctx.stroke();

            // Göğüs yüzgeci
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy + 10);
            ctx.quadraticCurveTo(cx - 30, cy + 40, cx - 10, cy + 10);
            ctx.stroke();
        } else if (type === 'goldfish') {
            // Tombul Altın Balık
            ctx.strokeStyle = '#FF8C00';
            ctx.lineWidth = 12;
            ctx.shadowColor = '#FFA500';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.ellipse(cx + 20, cy, 90, 65, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Büyük dalgalı kuyruk
            ctx.strokeStyle = '#FF4500';
            ctx.beginPath();
            ctx.moveTo(cx - 65, cy);
            ctx.bezierCurveTo(cx - 110, cy - 80, cx - 160, cy - 40, cx - 140, cy);
            ctx.bezierCurveTo(cx - 170, cy + 50, cx - 110, cy + 80, cx - 65, cy);
            ctx.stroke();

            // Göz
            ctx.beginPath();
            ctx.arc(cx + 70, cy - 20, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 73, cy - 20, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#111111';
            ctx.fill();
        }

        ctx.restore();
        this.saveState();
        this.updatePreviewImage();
    }

    // Çizimin boş olup olmadığını kontrol eder
    hasDrawing() {
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const d = imgData.data;
        for (let i = 3; i < d.length; i += 4) {
            if (d[i] > 10) return true; // Alfa değeri varsa çizim vardır
        }
        return false;
    }

    // Çizimi kırpıp optimize eder ve balık veri objesini üretir
    exportFishData(fishName, creatorName) {
        if (!this.hasDrawing()) {
            return null;
        }

        const w = this.canvas.width;
        const h = this.canvas.height;
        const imgData = this.ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Bounding Box bul
        let minX = w, minY = h, maxX = 0, maxY = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                if (d[idx + 3] > 15) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        // Padding ekle
        const pad = 12;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(w, maxX + pad);
        maxY = Math.min(h, maxY + pad);

        const cropW = Math.max(20, maxX - minX);
        const cropH = Math.max(20, maxY - minY);

        // Kırpılmış balık tuvali oluştur
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(this.canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        const dataUrl = cropCanvas.toDataURL('image/png');

        return {
            id: 'fish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: (fishName || 'Minik Yüzücü').trim().slice(0, 24),
            creator: (creatorName || 'Anonim İzleyici').trim().slice(0, 24),
            dataUrl: dataUrl,
            width: cropW,
            height: cropH,
            aspectRatio: cropW / cropH,
            createdAt: Date.now()
        };
    }

    updatePreviewImage() {
        if (!this.previewCanvas) return;
        const fishData = this.exportFishData('Önizleme', 'İzleyici');
        if (fishData) {
            const img = new Image();
            img.onload = () => {
                this.previewFish = {
                    img: img,
                    width: fishData.width,
                    height: fishData.height
                };
            };
            img.src = fishData.dataUrl;
        } else {
            this.previewFish = null;
        }
    }

    startPreviewAnimation() {
        const loop = () => {
            this.previewTime += 0.05;
            this.renderPreview();
            this.previewAnimFrame = requestAnimationFrame(loop);
        };
        loop();
    }

    renderPreview() {
        if (!this.previewCtx || !this.previewCanvas) return;
        const ctx = this.previewCtx;
        const w = this.previewCanvas.width;
        const h = this.previewCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Minik baloncuklar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        const bY = (h - ((this.previewTime * 20) % h));
        ctx.beginPath();
        ctx.arc(w * 0.2, bY, 3, 0, Math.PI * 2);
        ctx.arc(w * 0.8, (bY + 20) % h, 2, 0, Math.PI * 2);
        ctx.fill();

        if (this.previewFish && this.previewFish.img) {
            ctx.save();
            ctx.translate(w / 2, h / 2);

            // Canlı yüzme kıvrılma dalgası
            const wiggle = Math.sin(this.previewTime * 4) * 0.12;
            const bob = Math.cos(this.previewTime * 2) * 4;
            ctx.translate(0, bob);
            ctx.rotate(wiggle);

            const scale = Math.min((w * 0.75) / this.previewFish.width, (h * 0.75) / this.previewFish.height);
            ctx.scale(scale, scale);

            ctx.drawImage(
                this.previewFish.img,
                -this.previewFish.width / 2,
                -this.previewFish.height / 2
            );
            ctx.restore();
        } else {
            // Boşken rehber yazı
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Canlı Önizleme', w / 2, h / 2 + 4);
        }
    }
}

window.FishDrawingCanvas = FishDrawingCanvas;
