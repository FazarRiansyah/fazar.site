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
        // Disabled per user request
        return;
    },

    /**
     * Subtle "Pop" sound for UI interactions
     */
    playPop() {
        return;
    },
    playSuccess() {
        return;
    },
    playError() {
        return;
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
