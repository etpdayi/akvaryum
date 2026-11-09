/**
 * Pristagna Akvaryum - Web Audio API Synthesizer
 * Harici ses dosyalarına ihtiyaç duymadan saf tarayıcı sentezleyicisi ile ses efektleri.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.ambientNode = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
            this.startAmbience();
        } catch (e) {
            console.warn('AudioContext başlatılamadı:', e);
        }
    }

    ensureContext() {
        if (!this.initialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.ambientGain) {
            this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx ? this.ctx.currentTime : 0);
        }
        return this.isMuted;
    }

    // AFK Farm Altın Sesi (Coin Ding)
    playCoin() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    // Kozmetik Satın Alma Sesi (Purchase Chime)
    playBuy() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const now = this.ctx.currentTime + i * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.22);
        });
    }

    // Başka Akvaryuma Yardım Etme / Sevme Sesi
    playHelp() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Su baloncuk sesi (Bubble pop)
    playBubble(pitchMod = 1) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = (300 + Math.random() * 200) * pitchMod;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    // Oksijen hava pompası fıslama sesi
    playAirPump() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Beyaz gürültü buffer
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        filter.Q.setValueAtTime(3.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);

        // Birkaç tane hızlı baloncuk eşlik etsin
        for (let i = 0; i < 4; i++) {
            setTimeout(() => this.playBubble(1.2 + i * 0.2), i * 40);
        }
    }

    // Cam silme sünger / gıcırtı sesi
    playCleanWipe() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const startFreq = 400 + Math.random() * 250;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(startFreq + (Math.random() > 0.5 ? 180 : -150), now + 0.08);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Yem atma ve balığın yeme sesi (Nom nom)
    playEat() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);

        setTimeout(() => this.playBubble(1.5), 60);
    }

    // Büyüme / Seviye atlama sesi
    playLevelUp() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, High C
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.23);
        });
    }

    // 10. Seviyeye ulaşma sihirli çan sesi
    playFullGrownChime() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        chords.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.75);
        });
    }

    // Okyanusa salınma ritüeli & Kutlama sesi
    playAscension() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Yükselen ışıltı arpeji
        const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        scale.forEach((freq, i) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.42);
            }, i * 110);
        });

        // Su dalgası sesi
        setTimeout(() => {
            this.playWaterSplash();
        }, 300);
    }

    playWaterSplash() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(250, now + 0.7);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    // Arka plan derin su ambiyansı
    startAmbience() {
        if (!this.ctx || this.ambientNode) return;
        try {
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02; // Pembe gürültü filtresi
                lastOut = data[i];
                data[i] *= 3.5;
            }

            this.ambientNode = this.ctx.createBufferSource();
            this.ambientNode.buffer = buffer;
            this.ambientNode.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(140, this.ctx.currentTime);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, this.ctx.currentTime);

            this.ambientNode.connect(filter);
            filter.connect(this.ambientGain);
            this.ambientGain.connect(this.ctx.destination);

            this.ambientNode.start(0);
        } catch (e) {
            console.warn('Ambiyans başlatılamadı:', e);
        }
    }
}

window.soundEngine = new SoundEngine();
