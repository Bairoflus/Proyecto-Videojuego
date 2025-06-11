/**
 * Simple Audio Manager for main menu and floor music
 * Handles autoplay restrictions and floor-specific music
 */
class SimpleAudioManager {
    constructor() {
        this.audio = null;
        this.currentTrack = null;
        this.isSetup = false;
    }

    /**
     * Initialize audio with specified source
     */
    initializeAudio(src) {
        if (this.audio && this.currentTrack === src) {
            return this.audio; // Return existing if same track
        }
        
        // Stop and clear previous audio
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        
        console.log('🎵 Creating audio instance for:', src);
        this.audio = new Audio(src);
        this.audio.loop = true;
        this.audio.volume = 0.3;
        this.currentTrack = src;
        
        this.audio.addEventListener('error', (e) => {
            console.error('🎵 Audio error:', e);
        });
        
        return this.audio;
    }

    /**
     * Start playing main menu music
     */
    async playMainMenuMusic() {
        console.log('🎵 playMainMenuMusic called');
        this.initializeAudio('../../assets/sound_assets/music/main-menu.mp3');
        
        if (!this.audio.paused) {
            console.log('🎵 Music already playing');
            return;
        }
        
        try {
            console.log('🎵 Attempting to play main menu music');
            await this.audio.play();
            console.log('🎵 Main menu music started successfully');
        } catch (error) {
            console.log('🎵 Autoplay blocked:', error.message);
            this.setupClickHandler();
        }
    }

    /**
     * Start playing floor-specific music
     */
    async playFloorMusic(floorNumber) {
        const floorTracks = {
            1: '../../assets/sound_assets/music/floor1.mp3',
            2: '../../assets/sound_assets/music/floor2.mp3',
            3: '../../assets/sound_assets/music/floor3.mp3'
        };
        
        const trackSrc = floorTracks[floorNumber];
        if (!trackSrc) {
            console.warn(`🎵 No music track for floor ${floorNumber}`);
            return;
        }
        
        console.log(`🎵 Playing Floor ${floorNumber} music`);
        this.initializeAudio(trackSrc);
        
        try {
            await this.audio.play();
            console.log(`🎵 Floor ${floorNumber} music started successfully`);
        } catch (error) {
            console.log('🎵 Autoplay blocked:', error.message);
            this.setupClickHandler();
        }
    }

    /**
     * Setup click handler for autoplay restrictions
     */
    setupClickHandler() {
        if (this.isSetup) {
            console.log('🎵 Click handler already setup');
            return;
        }
        
        console.log('🎵 Setting up click handler');
        const playOnInteraction = async (event) => {
            console.log('🎵 User interaction detected:', event.type);
            if (this.audio && this.audio.paused) {
                try {
                    await this.audio.play();
                    console.log('🎵 Music started after user interaction');
                    
                    // Remove event listeners after successful play
                    document.removeEventListener('click', playOnInteraction);
                    document.removeEventListener('keydown', playOnInteraction);
                    document.removeEventListener('touchstart', playOnInteraction);
                    this.isSetup = false;
                } catch (error) {
                    console.error('🎵 Failed to play after interaction:', error);
                }
            }
        };
        
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('keydown', playOnInteraction);
        document.addEventListener('touchstart', playOnInteraction);
        this.isSetup = true;
        
        console.log('🎵 Click handler setup complete - click anywhere to start music');
    }

    /**
     * Stop music completely
     */
    stopMusic() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            console.log('🎵 Music stopped');
        }
    }

    /**
     * Check if music is playing
     */
    isPlaying() {
        return this.audio && !this.audio.paused;
    }

    /**
     * Clean up for game page
     */
    cleanupForGamePage() {
        this.stopMusic();
        console.log('🎵 Cleaned up for game page');
    }
}

// Create and export singleton instance
const persistentAudioManager = new SimpleAudioManager();
export { persistentAudioManager, SimpleAudioManager };
