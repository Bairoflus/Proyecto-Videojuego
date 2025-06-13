/**
 * Audio Manager for main menu, floor music, and sound effects
 * Handles autoplay restrictions and audio playback
 */
class SimpleAudioManager {
  constructor() {
    this.audio = null; // Background music
    this.currentTrack = null;
    this.isSetup = false;
    this.sfxVolume = 0.7; // Volume for sound effects
    this.musicVolume = 0.3; // Volume for background music
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

    console.log("Creating audio instance for:", src);
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = this.musicVolume;
    this.currentTrack = src;

    this.audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
    });

    return this.audio;
  }

  /**
   * Start playing main menu music
   */
  async playMainMenuMusic() {
    console.log("playMainMenuMusic called");
    this.initializeAudio("/assets/sound_assets/music/main-menu.mp3");

    if (!this.audio.paused) {
      console.log("🎵 Music already playing");
      return;
    }

    try {
      console.log("Attempting to play main menu music");
      await this.audio.play();
      console.log("Main menu music started successfully");
    } catch (error) {
      console.log("Autoplay blocked:", error.message);
      this.setupClickHandler();
    }
  }

  /**
   * Start playing floor-specific music
   */
  async playFloorMusic(floorNumber) {
    const floorTracks = {
      1: "/assets/sound_assets/music/floor1.mp3",
      2: "/assets/sound_assets/music/floor2.mp3",
      3: "/assets/sound_assets/music/floor3.mp3",
    };

    const trackSrc = floorTracks[floorNumber];
    if (!trackSrc) {
      console.warn(`No music track for floor ${floorNumber}`);
      return;
    }

    console.log(`Playing Floor ${floorNumber} music`);
    this.initializeAudio(trackSrc);

    try {
      await this.audio.play();
      console.log(`Floor ${floorNumber} music started successfully`);
    } catch (error) {
      console.log("Autoplay blocked:", error.message);
      this.setupClickHandler();
    }
  }

  /**
   * Play sound effect (SFX)
   * These are short sounds that don't loop
   * Handles both audio files and .mov files with audio tracks
   */
  playSFX(sfxPath) {
    try {
      console.log("Playing SFX:", sfxPath);

      // Check if it's a .mov file (video with audio)
      if (sfxPath.toLowerCase().endsWith(".mov")) {
        const sfxVideo = document.createElement("video");
        sfxVideo.src = sfxPath;
        sfxVideo.volume = this.sfxVolume;
        sfxVideo.style.display = "none"; // Hide the video element
        document.body.appendChild(sfxVideo);

        // Remove video element after playback
        sfxVideo.addEventListener("ended", () => {
          document.body.removeChild(sfxVideo);
        });

        sfxVideo.addEventListener("error", (e) => {
          console.warn("SFX video play failed:", e.target.error);
          if (document.body.contains(sfxVideo)) {
            document.body.removeChild(sfxVideo);
          }
        });

        sfxVideo.play().catch((error) => {
          console.warn("SFX video play failed:", error.message);
          if (document.body.contains(sfxVideo)) {
            document.body.removeChild(sfxVideo);
          }
        });
      } else {
        // Handle regular audio files
        const sfxAudio = new Audio(sfxPath);
        sfxAudio.volume = this.sfxVolume;
        sfxAudio.play().catch((error) => {
          console.warn("SFX play failed:", error.message);
        });
      }
    } catch (error) {
      console.error("SFX error:", error);
    }
  }

  /**
   * Play enemy death sound
   */
  playEnemyDeathSFX() {
    this.playSFX("/assets/sound_assets/sfx/enemies/enemy-dead.mp3");
  }

  /**
   * Play chest opened sound
   */
  playChestOpenedSFX() {
    this.playSFX("/assets/sound_assets/sfx/game_events/chest-opened.mp3");
  }

  /**
   * Play store purchase sound
   */
  playStorePurchaseSFX() {
    this.playSFX("/assets/sound_assets/sfx/game_events/store-purchase.mp3");
  }

  /**
   * Play time travel (floor transition) sound
   */
  playTimeTravelSFX() {
    this.playSFX("/assets/sound_assets/sfx/game_events/time-travel.mp3");
  }

  /**
   * Play player dash sound
   */
  playPlayerDashSFX() {
    this.playSFX("/assets/sound_assets/sfx/player/dash.mp3");
  }

  /**
   * Play player hurt sound
   */
  playPlayerHurtSFX() {
    this.playSFX("/assets/sound_assets/sfx/player/player-hurt.mp3");
  }

  /**
   * Setup click handler for autoplay restrictions
   */
  setupClickHandler() {
    if (this.isSetup) {
      console.log("Click handler already setup");
      return;
    }

    console.log("Setting up click handler");
    const playOnInteraction = async (event) => {
      console.log("User interaction detected:", event.type);
      if (this.audio && this.audio.paused) {
        try {
          await this.audio.play();
          console.log("Music started after user interaction");

          // Remove event listeners after successful play
          document.removeEventListener("click", playOnInteraction);
          document.removeEventListener("keydown", playOnInteraction);
          document.removeEventListener("touchstart", playOnInteraction);
          this.isSetup = false;
        } catch (error) {
          console.error("Failed to play after interaction:", error);
        }
      }
    };

    document.addEventListener("click", playOnInteraction);
    document.addEventListener("keydown", playOnInteraction);
    document.addEventListener("touchstart", playOnInteraction);
    this.isSetup = true;

    console.log(
      "Click handler setup complete - click anywhere to start music"
    );
  }

  /**
   * Stop music completely
   */
  stopMusic() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log("Music stopped");
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
    console.log("Cleaned up for game page");
  }
}

// Create and export singleton instance
const persistentAudioManager = new SimpleAudioManager();
export { persistentAudioManager, SimpleAudioManager };
