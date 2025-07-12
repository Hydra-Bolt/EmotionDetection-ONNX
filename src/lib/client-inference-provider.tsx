'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeONNXRuntime, runClientInference } from './client-inference';

interface InferenceContextType {
  isReady: boolean;
  error: string | null;
  runInference: (text: string) => Promise<number[]>;
}

const InferenceContext = createContext<InferenceContextType | null>(null);

export function useInference() {
  const context = useContext(InferenceContext);
  if (!context) {
    throw new Error('useInference must be used within InferenceProvider');
  }
  return context;
}

interface InferenceProviderProps {
  children: ReactNode;
}

export default function ClientInferenceProvider({ children }: InferenceProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeONNXRuntime();
        setIsReady(true);
      } catch (err: any) {
        setError(`Failed to initialize ONNX Runtime: ${err.message}`);
      }
    };

    init();
  }, []);

  const runInference = async (text: string): Promise<number[]> => {
    if (!isReady) {
      throw new Error('ONNX Runtime not ready');
    }
    
    const result = await runClientInference(text);
    return result;
  };

  return (
    <InferenceContext.Provider value={{ isReady, error, runInference }}>
      {children}
    </InferenceContext.Provider>
  );
}
