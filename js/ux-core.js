/**
 * #JagaDokumen - Premium UX Core
 * Handles Audio Feedback, Haptic Visuals, and Advanced UI States
 * Standard: Jakarta Government Premium Aesthetics
 */

const JagaUX = {
    // Sound generation using Web Audio API (Offline-first)
    audioContext: null,

    init() {
        // Initialize Audio Context on first user interaction (browser requirement)
        document.addEventListener('mousedown', () => this.resumeAudio(), { once: true });
        document.addEventListener('keydown', () => this.resumeAudio(), { once: true });
        
        console.log("💎 JagaDokumen Premium UX initialized");
    },

    resumeAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    /**
     * Subtle "Pop" sound for UI interactions
     */
    playPop() {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    },

    /**
     * Professional "Ding" sound for success
     */
    playSuccess() {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);

        gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    },

    /**
     * Subtle "Thud" for errors or warnings
     */
    playError() {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.audioContext.currentTime + 0.2);

        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    },

    /**
     * Triggers a visual "pulse" on an element
     */
    pulseElement(el) {
        if (!el) return;
        el.style.transform = 'scale(0.96)';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
        }, 100);
    },

    /**
     * Enhanced Toast with Sound Support
     */
    notify(message, type = 'success') {
        // Play appropriate sound
        if (type === 'success') this.playSuccess();
        else if (type === 'error') this.playError();
        else this.playPop();

        // Call the original showToast if it exists
        if (typeof showToast === 'function') {
            showToast(message, type);
        }
    }
};

// Auto-initialize UX
JagaUX.init();
