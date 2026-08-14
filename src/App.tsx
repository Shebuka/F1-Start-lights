import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Flag, RotateCcw, Play, Timer, Zap, AlertTriangle, Trophy } from 'lucide-react';

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

  const [reactionTimeMode, setReactionTimeMode] = useState(false);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const [falseStart, setFalseStart] = useState(false);
  const [bestReactionTime, setBestReactionTime] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const audioContextRef = useRef<AudioContextState>({ context: null, initialized: false });
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lightsOffTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const best = localStorage.getItem('bestReactionTime');
    if (best) setBestReactionTime(parseInt(best));
  }, []);

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

  const playBimSound = useCallback(async () => {
    if (!soundEnabled) return;

    await initializeAudio();
    const { context } = audioContextRef.current;

    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(493.883, context.currentTime);

      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.2);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, [soundEnabled, initializeAudio]);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  const resetSequence = useCallback(() => {
    clearAllTimeouts();
    setLightStrips([false, false, false, false, false]);
    setIsSequenceActive(false);
    setSequenceType(null);
    setShowGoSignal(false);
    setFormationLapPhase(null);
    setWaitingForTap(false);
    setReactionTime(null);
    setFalseStart(false);
    setIsNewBest(false);
  }, [clearAllTimeouts]);

  const startRaceSequence = useCallback(async () => {
    if (isSequenceActive) return;

    await initializeAudio();
    resetSequence();

    setReactionTime(null);
    setFalseStart(false);
    setWaitingForTap(false);
    setIsNewBest(false);

    setIsSequenceActive(true);
    setSequenceType('race');
    setShowGoSignal(false);

    const isReactionMode = reactionTimeMode;

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

    const randomDelay = Math.random() * 4000 + 1000;

    const finalTimeout = setTimeout(() => {
      setLightStrips([false, false, false, false, false]);

      if (isReactionMode) {
        lightsOffTimeRef.current = Date.now();
        setWaitingForTap(true);
        setIsSequenceActive(false);
        setSequenceType(null);
      } else {
        setShowGoSignal(true);
        setIsSequenceActive(false);

        const hideGoTimeout = setTimeout(() => {
          setShowGoSignal(false);
          setSequenceType(null);
        }, 6000);

        timeoutRefs.current.push(hideGoTimeout);
      }
    }, 5000 + randomDelay);

    timeoutRefs.current.push(finalTimeout);
  }, [isSequenceActive, initializeAudio, resetSequence, playBimSound, reactionTimeMode]);

  const startFormationLapSequence = useCallback(async () => {
    if (isSequenceActive) return;

    await initializeAudio();
    resetSequence();
    setReactionTimeMode(false);

    setIsSequenceActive(true);
    setSequenceType('formation');
    setShowGoSignal(false);

    setLightStrips([true, true, true, true, true]);
    setFormationLapPhase('red');
    playBimSound();

    const randomDelay = Math.random() * 3000 + 2000;

    const greenTimeout = setTimeout(() => {
      setLightStrips([false, false, false, false, false]);
      setFormationLapPhase('green');
      playBimSound();
      setShowGoSignal(true);

      const endTimeout = setTimeout(() => {
        setFormationLapPhase(null);
        setIsSequenceActive(false);

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

  const handleReactionTap = useCallback(() => {
    if (!reactionTimeMode) return;

    if (isSequenceActive && !waitingForTap) {
      clearAllTimeouts();
      setLightStrips([false, false, false, false, false]);
      setIsSequenceActive(false);
      setFalseStart(true);
      setWaitingForTap(false);
      setSequenceType(null);
    } else if (waitingForTap) {
      const time = lightsOffTimeRef.current ? Date.now() - lightsOffTimeRef.current : 0;
      setReactionTime(time);
      setWaitingForTap(false);

      if (time > 0 && time < 1000) {
        if (bestReactionTime === null || time < bestReactionTime) {
          setBestReactionTime(time);
          setIsNewBest(true);
          localStorage.setItem('bestReactionTime', time.toString());
        }
      }
    }
  }, [reactionTimeMode, isSequenceActive, waitingForTap, clearAllTimeouts, bestReactionTime]);

  useEffect(() => {
    if (!reactionTimeMode) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleReactionTap();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reactionTimeMode, handleReactionTap]);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      if (audioContextRef.current.context) {
        audioContextRef.current.context.close();
      }
    };
  }, [clearAllTimeouts]);

  const getReactionQuality = (time: number) => {
    if (time < 200) return { label: 'Superhuman!', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' };
    if (time < 300) return { label: 'Lightning!', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' };
    if (time < 400) return { label: 'Good', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' };
    return { label: 'Keep practicing', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' };
  };

  const canTap = reactionTimeMode && sequenceType === 'race' && (isSequenceActive || waitingForTap);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex flex-col items-center p-4 pt-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-wider">
          F1 STARTING LIGHTS
        </h1>
      </div>

      <div
        onClick={canTap ? handleReactionTap : undefined}
        className={`bg-black/80 backdrop-blur-sm border rounded-2xl p-8 md:p-12 shadow-2xl transition-all duration-300 ${
          waitingForTap
            ? 'border-green-500/60 cursor-pointer shadow-green-500/20'
            : canTap
            ? 'border-red-600/30 cursor-pointer'
            : 'border-red-600/30'
        }`}
      >
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

        {showGoSignal && !reactionTimeMode && (
          <div className="text-center mt-8">
            <div className="inline-block bg-green-500 text-black text-2xl md:text-3xl font-bold px-8 py-4 rounded-lg animate-pulse shadow-lg">
              GO! GO! GO!
            </div>
          </div>
        )}

        {reactionTimeMode && (
          <div className="text-center mt-8 min-h-[60px] flex items-center justify-center">
            {waitingForTap && (
              <div className="text-3xl md:text-4xl font-bold text-green-400 animate-pulse tracking-wider">
                TAP NOW!
              </div>
            )}
            {falseStart && (
              <div className="inline-flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-red-400">
                  <AlertTriangle className="w-7 h-7" />
                  FALSE START!
                </div>
                <div className="text-sm text-red-300/70">You jumped the lights!</div>
              </div>
            )}
            {reactionTime !== null && !falseStart && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <Zap className={`w-7 h-7 ${getReactionQuality(reactionTime).color}`} />
                  <span className={`text-4xl md:text-5xl font-bold ${getReactionQuality(reactionTime).color}`}>
                    {reactionTime}<span className="text-2xl">ms</span>
                  </span>
                </div>
                <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold border ${getReactionQuality(reactionTime).bg} ${getReactionQuality(reactionTime).color} ${getReactionQuality(reactionTime).border}`}>
                  {getReactionQuality(reactionTime).label}
                </div>
                {isNewBest && (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-300 animate-pulse">
                    <Trophy className="w-4 h-4" />
                    NEW PERSONAL BEST!
                  </div>
                )}
              </div>
            )}
            {isSequenceActive && !waitingForTap && !falseStart && reactionTime === null && (
              <div className="text-gray-500 text-lg font-medium">
                Wait for lights out...
              </div>
            )}
            {!isSequenceActive && !waitingForTap && !falseStart && reactionTime === null && (
              <div className="text-gray-600 text-sm">
                Press START RACE to begin
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 mt-8">
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

      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              checked={reactionTimeMode}
              onChange={(e) => setReactionTimeMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-500 rounded-full transition-colors"></div>
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-md"></div>
          </div>
          <span className={`font-medium flex items-center gap-2 transition-colors ${reactionTimeMode ? 'text-green-400' : 'text-gray-400'}`}>
            <Timer className="w-4 h-4" />
            Check reaction time
          </span>
          {bestReactionTime !== null && (
            <span className="flex items-center gap-1 text-sm text-yellow-300/80 ml-2">
              <Trophy className="w-3.5 h-3.5" />
              Best: {bestReactionTime}ms
            </span>
          )}
        </label>
      </div>

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

      {sequenceType && (
        <div className="text-center mb-4">
          <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
            sequenceType === 'race'
              ? reactionTimeMode
                ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                : 'bg-red-600/20 text-red-300 border border-red-600/30'
              : 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30'
          }`}>
            {sequenceType === 'race'
              ? reactionTimeMode
                ? 'REACTION TIME CHECK'
                : 'OFFICIAL RACE START'
              : 'FORMATION LAP SEQUENCE'}
          </div>
        </div>
      )}

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
        <p className="mb-2">
          <strong className="text-green-400">REACTION TIME:</strong> Same light sequence, but no GO message. Tap the lights panel (or press Space) the instant lights go out. Tap too early and it's a false start!
        </p>
      </div>
    </div>
  );
};

export default App;
