/**
 * Alert Sound Synthesizer
 * Generates authoritative maritime radar ping and emergency Coast Guard alarm chimes
 * using standard browser Web Audio API (Zero external assets required).
 */

class AlertAudioService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play Sonar Sweep Ping (Subtle radar pulse sound)
   */
  public playSonarPing() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Play Emergency Oil Spill Alarm (High-priority dual warble tone)
   */
  public playEmergencyAlarm() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // First siren burst (800Hz -> 1200Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(750, now);
      osc1.frequency.linearRampToValueAtTime(1150, now + 0.2);
      osc1.frequency.linearRampToValueAtTime(750, now + 0.4);
      osc1.frequency.linearRampToValueAtTime(1150, now + 0.6);

      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

      // Low pass filter to make it sound like a marine radio chime
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      osc1.connect(filter);
      filter.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.8);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Play Alert Dispatched Confirm Chime
   */
  public playDispatchSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {}
  }
}

export const alertSoundService = new AlertAudioService();
