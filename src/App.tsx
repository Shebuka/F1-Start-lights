import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Flag, RotateCcw, Play } from 'lucide-react';

interface AudioContextState {
  context: AudioContext | null;
  initialized: boolean;
}

const App: React.FC = () => {
  const [lightStrips, setLightStrips] = useState<boolean[]>([false, false, false, false, false]);
  const [isSequenceActive, setIsSequenceActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sequenceType, setSequenceType] = useState<'race' | 'formation' | null>(null);
  const [showGoSignal, setShowGoSignal] = useState(false);
  const [formationLapPhase, setFormationLapPhase] = useState<'red' | 'green' | null>(null);
  
  const audioContextRef = useRef<AudioContextState>({ context: null, initialized: false });
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Initialize Web Audio Context
  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current.initialized) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextClass();
        
        if (context.state === 'suspended') {
          await context.resume();
        }
        
        audioContextRef.current = { context, initialized: true };
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
        audioContextRef.current = { context: null, initialized: true };
      }
    }
  }, []);

  // Generate "bim" sound effect at M key frequency (493.883 Hz)
  const playBimSound = useCallback(async () => {
    if (!soundEnabled) return;
    
    await initializeAudio();
    const { context } = audioContextRef.current;
    
    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Configure oscillator for M key frequency
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(493.883, context.currentTime);

      // Configure gain for low volume
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01); // Low volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);

      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Play sound
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.2);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, [soundEnabled, initializeAudio]);

  // Clear all active timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  // Reset to initial state
  const resetSequence = useCallback(() => {
    clearAllTimeouts();
    setLightStrips([false, false, false, false, false]);
    setIsSequenceActive(false);
    setSequenceType(null);
    setShowGoSignal(false);
    setFormationLapPhase(null);
  }, [clearAllTimeouts]);

  // Start race sequence (original F1 start)
  const startRaceSequence = useCallback(async () => {
    if (isSequenceActive) return;
    
    await initializeAudio();
    resetSequence();
    
    setIsSequenceActive(true);
    setSequenceType('race');
    setShowGoSignal(false);

    // Turn on light strips one by one
    for (let i = 0; i < 5; i++) {
      const timeout = setTimeout(() => {
        playBimSound();
        setLightStrips(prev => {
          const newStrips = [...prev];
          newStrips[i] = true;
          return newStrips;
        });
      }, i * 1000);
      
      timeoutRefs.current.push(timeout);
    }

    // After all lights are on, wait random time then turn all off
    const randomDelay = Math.random() * 4000 + 1000; // 1-5 seconds

    const finalTimeout = setTimeout(() => {
      setLightStrips([false, false, false, false, false]);
      setShowGoSignal(true);
      setIsSequenceActive(false);
      
      // Hide GO signal after 2 seconds
      const hideGoTimeout = setTimeout(() => {
        setShowGoSignal(false);
        setSequenceType(null);
      }, 6000);
      
      timeoutRefs.current.push(hideGoTimeout);
    }, 5000 + randomDelay);
    
    timeoutRefs.current.push(finalTimeout);
  }, [isSequenceActive, initializeAudio, resetSequence, playBimSound]);

  // Start formation lap sequence
  const startFormationLapSequence = useCallback(async () => {
    if (isSequenceActive) return;
    
    await initializeAudio();
    resetSequence();
    
    setIsSequenceActive(true);
    setSequenceType('formation');
    setShowGoSignal(false);

    // Start with all red lights on
    setLightStrips([true, true, true, true, true]);
    setFormationLapPhase('red');
    playBimSound();

    // After random delay, turn off red lights and turn on green lights (strips 2 and 4)
    const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds

    const greenTimeout = setTimeout(() => {
      setLightStrips([false, false, false, false, false]);
      setFormationLapPhase('green');
      playBimSound();
      setShowGoSignal(true);
      
      // Show green for 2 seconds then end sequence
      const endTimeout = setTimeout(() => {
        setFormationLapPhase(null);
        setIsSequenceActive(false);
        
        // Hide GO signal after 2 seconds
        const hideGoTimeout = setTimeout(() => {
          setShowGoSignal(false);
          setSequenceType(null);
        }, 1000);
        
        timeoutRefs.current.push(hideGoTimeout);
      }, 5000);
      
      timeoutRefs.current.push(endTimeout);
    }, randomDelay);
    
    timeoutRefs.current.push(greenTimeout);
  }, [isSequenceActive, initializeAudio, resetSequence, playBimSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      if (audioContextRef.current.context) {
        audioContextRef.current.context.close();
      }
    };
  }, [clearAllTimeouts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex flex-col items-center p-4 pt-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-wider">
          F1 STARTING LIGHTS
        </h1>
      </div>

      {/* F1 Lights Container */}
      <div className="bg-black/80 backdrop-blur-sm border border-red-600/30 rounded-2xl p-8 md:p-12 shadow-2xl">
        {/* F1 Lights */}
        <div className="flex justify-center">
          <div className="f1-lights">
            <div className="back-board"></div>
            {lightStrips.map((isOn, stripIndex) => (
              <div 
                key={stripIndex}
                className={`light-strip ${
                  (sequenceType === 'race' && isOn) ? 'on' : 
                  (sequenceType === 'formation' && formationLapPhase === 'red' && isOn) ? 'on' :
                  (sequenceType === 'formation' && formationLapPhase === 'green' && (stripIndex === 1 || stripIndex === 3)) ? 'green' : ''
                }`}
              >
                <div className="light"></div>
                <div className="light"></div>
                <div className="light"></div>
                <div className="light"></div>
              </div>
            ))}
          </div>
        </div>

        {/* GO Signal */}
        {showGoSignal && (
          <div className="text-center mt-8">
            <div className="inline-block bg-green-500 text-black text-2xl md:text-3xl font-bold px-8 py-4 rounded-lg animate-pulse shadow-lg">
              GO! GO! GO!
            </div>
          </div>
        )}
      </div>

      {/* Main Start Race Button */}
      <div className="mb-6 mt-8">
        <button
          onClick={startRaceSequence}
          disabled={isSequenceActive}
          className={`flex items-center gap-4 px-12 py-6 rounded-2xl font-bold text-2xl transition-all duration-200 shadow-2xl ${
            isSequenceActive
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/50 active:scale-95 hover:scale-105'
          }`}
        >
          <Flag className="w-8 h-8" />
          START RACE
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
        <button
          onClick={startFormationLapSequence}
          disabled={isSequenceActive}
          className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 min-w-[180px] justify-center ${
            isSequenceActive
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg hover:shadow-yellow-500/30 active:scale-95'
          }`}
        >
          <Play className="w-5 h-5" />
          FORMATION LAP
        </button>

        <button
          onClick={resetSequence}
          className="flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-lg bg-gray-700 hover:bg-gray-800 text-white transition-all duration-200 min-w-[180px] justify-center shadow-lg active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          RESET
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-4 py-4 rounded-xl font-medium transition-all duration-200 ${
            soundEnabled
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
      </div>

      {/* Status Indicator */}
      {sequenceType && (
        <div className="text-center mb-4">
          <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
            sequenceType === 'race' 
              ? 'bg-red-600/20 text-red-300 border border-red-600/30' 
              : 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30'
          }`}>
            {sequenceType === 'race' ? 'OFFICIAL RACE START' : 'FORMATION LAP SEQUENCE'}
          </div>
        </div>
      )}

      {/* Static Instructions */}
      <div className="text-center text-gray-400 max-w-lg mx-auto px-4 pb-8">
        <p className="text-red-300 text-lg md:text-xl">
          F1 Start Lights and Race Control System
        </p>
        <p className="mb-2">
          <strong className="text-red-400">START RACE:</strong> 5 red light strips activate sequentially, when all lights turn off simultaneously - that's your GO signal!
        </p>
        <p className="mb-2">
          <strong className="text-yellow-400">FORMATION LAP:</strong> All red lights on, then green lights signal GO for the formation lap!
        </p>
      </div>

    </div>
  );
};

export default App;