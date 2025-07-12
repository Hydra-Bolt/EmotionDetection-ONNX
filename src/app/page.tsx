"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runClientInference, initializeONNXRuntime } from '../lib/client-inference';

// Emotion labels mapping for the model output
const EMOTION_LABELS = [
  'sadness', 'joy', 'love', 'fear', 'anger', 'surprise'
];

const EMOTION_COLORS = {
  sadness: 'from-blue-500 to-blue-700',
  joy: 'from-yellow-400 to-orange-500',
  love: 'from-pink-500 to-rose-500',
  fear: 'from-purple-500 to-purple-700',
  anger: 'from-red-500 to-red-700',
  surprise: 'from-green-500 to-emerald-600'
};

const EMOTION_EMOJIS = {
  sadness: '😢',
  joy: '😄',
  love: '❤️',
  fear: '😨',
  anger: '😠',
  surprise: '😲'
};

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);

  // Initialize ONNX Runtime on component mount
  useEffect(() => {
    const initializeRuntime = async () => {
      try {
        setModelLoadingProgress(10);
        await initializeONNXRuntime();
        setModelLoadingProgress(50);
        
        // Preload the model by making a dummy inference
        const dummyText = "test";
        setModelLoadingProgress(80);
        await runClientInference(dummyText);
        setModelLoadingProgress(100);
        
        // Small delay to show completion
        setTimeout(() => {
          setIsModelLoading(false);
        }, 500);
      } catch (err: any) {
        setError(`Failed to initialize ONNX Runtime: ${err.message}`);
        setIsModelLoading(false);
      }
    };

    initializeRuntime();
  }, []);

  // Debounce hook for live inference
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedText = useDebounce(text, 1000); // 1 second delay

  const runInference = useCallback(async (inputText: string) => {
    if (!inputText.trim() || isModelLoading) {
      setResult(null);
      setInferenceTime(null);
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();
    
    try {
      const output = await runClientInference(inputText);
      const endTime = performance.now();
      
      setResult(output);
      setInferenceTime(endTime - startTime);
    } catch (err: any) {
      setError(err.message);
      setInferenceTime(null);
    } finally {
      setLoading(false);
    }
  }, [isModelLoading]);

  // Trigger inference when debounced text changes
  useEffect(() => {
    runInference(debouncedText);
  }, [debouncedText, runInference]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Manual submission will trigger immediate inference
    await runInference(text);
  }

  // Process model output to get emotion probabilities
  const getEmotionProbabilities = (output: any) => {
    console.log('Processing output:', output, typeof output);
    
    if (!output) return [];
    
    // Handle case where output is an object with numeric keys (from serialized Float32Array)
    let outputArray: number[] = [];
    if (Array.isArray(output)) {
      outputArray = output;
    } else if (typeof output === 'object') {
      // Convert object with numeric keys back to array
      const keys = Object.keys(output).map(k => parseInt(k)).sort((a, b) => a - b);
      outputArray = keys.map(k => output[k]);
    } else {
      return [];
    }
    
    console.log('Output array:', outputArray);
    
    // Convert output to probabilities using softmax
    const exp = outputArray.map((x: number) => Math.exp(x));
    const sum = exp.reduce((a: number, b: number) => a + b, 0);
    const probabilities = exp.map((x: number) => x / sum);
    
    return EMOTION_LABELS.map((label, index) => ({
      emotion: label,
      probability: probabilities[index] || 0,
      emoji: EMOTION_EMOJIS[label as keyof typeof EMOTION_EMOJIS]
    })).sort((a, b) => b.probability - a.probability);
  };

  const emotionResults = result ? getEmotionProbabilities(result) : [];
  const topEmotion = emotionResults[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-16"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-block text-5xl sm:text-8xl mb-4 sm:mb-6"
          >
            🎭
          </motion.div>
          <h1 className="text-4xl sm:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 sm:mb-6 tracking-tight">
            Emotion Detector
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4"
          >
            Unlock the hidden emotions in your text with cutting-edge AI technology.
            <br />
            <span className="text-cyan-400 font-semibold">Powered by BERT & ONNX</span> for lightning-fast analysis.
          </motion.p>
          
          {/* Model Loading Progress Bar */}
          <AnimatePresence>
            {isModelLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 max-w-md mx-auto"
              >
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-white font-semibold">Initializing AI Model...</span>
                  </div>
                  
                  <div className="relative">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${modelLoadingProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>Loading ONNX Runtime...</span>
                      <span>{modelLoadingProgress}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-400 text-center">
                    {modelLoadingProgress < 30 && "Initializing runtime..."}
                    {modelLoadingProgress >= 30 && modelLoadingProgress < 70 && "Loading model weights..."}
                    {modelLoadingProgress >= 70 && modelLoadingProgress < 100 && "Warming up model..."}
                    {modelLoadingProgress === 100 && "Ready! 🎉"}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          {/* Results Display - Moved above input */}
          <AnimatePresence>
            {emotionResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="mb-8"
              >
                {/* Top Emotion Highlight */}
                {topEmotion && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="mb-6 relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl blur-lg" />
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur border border-white/20 text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <motion.div 
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-4xl sm:text-5xl"
                        >
                          {topEmotion.emoji}
                        </motion.div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-xl sm:text-3xl font-bold text-white capitalize mb-2">
                            {topEmotion.emotion}
                          </h3>
                          <div className="flex items-center justify-center sm:justify-start gap-3">
                            <div className="h-2 w-20 sm:w-24 bg-white/20 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${topEmotion.probability * 100}%` }}
                                transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                              />
                            </div>
                            <span className="text-base sm:text-lg font-bold text-white">
                              {(topEmotion.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                          {inferenceTime && (
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                              Analyzed in {inferenceTime.toFixed(0)}ms
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Compact Emotions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                  {emotionResults.map((emotion, index) => (
                    <motion.div
                      key={emotion.emotion}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative p-2 sm:p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10 text-center hover:bg-white/10 transition-colors"
                    >
                      <div className="text-lg sm:text-2xl mb-1">{emotion.emoji}</div>
                      <div className="text-xs font-medium text-white capitalize mb-1">
                        {emotion.emotion}
                      </div>
                      <div className="text-xs text-gray-300">
                        {(emotion.probability * 100).toFixed(0)}%
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${emotion.probability * 100}%` }}
                          transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }}
                          className={`h-full bg-gradient-to-r ${EMOTION_COLORS[emotion.emotion as keyof typeof EMOTION_COLORS]}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Section - Made smaller and compact */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur-lg opacity-75" />
            
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="text-input" className="flex items-center gap-2 text-base sm:text-lg font-semibold text-white mb-3">
                    <span className="text-lg sm:text-xl">💭</span>
                    {isModelLoading ? 'AI model is loading...' : 'Express yourself'}
                    {(loading && !isModelLoading) && (
                      <motion.div 
                        className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full ml-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      id="text-input"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      rows={3}
                      placeholder={isModelLoading ? "Loading AI model, please wait..." : "Start typing to see live emotion analysis..."}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-white/20 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 bg-white/5 backdrop-blur text-white placeholder-gray-400 resize-none shadow-inner"
                    />
                    <div className="absolute bottom-2 right-3 flex items-center gap-2 sm:gap-3 text-xs text-gray-400">
                      <span>{text.length} chars</span>
                      {inferenceTime && !loading && (
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                          {inferenceTime.toFixed(0)}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <motion.button 
                  type="submit" 
                  disabled={loading || !text.trim() || isModelLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base transition-all duration-300 shadow-lg disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <div className="relative flex items-center justify-center gap-2">
                    {isModelLoading ? (
                      <>
                        <motion.div 
                          className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Model Loading... {modelLoadingProgress}%
                      </>
                    ) : loading ? (
                      <>
                        <motion.div 
                          className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span className="text-base sm:text-lg">🔮</span>
                        Analyze Now
                      </>
                    )}
                  </div>
                </motion.button>
              </form>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur"
                  >
                    <div className="flex items-center gap-2 text-red-200">
                      <span className="text-base sm:text-lg">⚠️</span>
                      <div>
                        <span className="font-semibold text-sm sm:text-base">Error:</span>
                        <p className="text-xs sm:text-sm">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>



          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-8 sm:mt-16"
          >
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 backdrop-blur rounded-full border border-white/10">
              <span className="text-lg sm:text-2xl">⚡</span>
              <span className="text-xs sm:text-base text-gray-300">
                Powered by <span className="text-cyan-400 font-semibold">BERT</span> • 
                <span className="text-purple-400 font-semibold">Next.js</span> & 
                <span className="text-pink-400 font-semibold">ONNX</span>
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
