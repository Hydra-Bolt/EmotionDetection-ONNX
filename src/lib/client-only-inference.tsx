'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamic import to ensure ONNX Runtime Web only loads on client side
const ClientInferenceProvider = dynamic(
  () => import('./client-inference-provider'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <span className="ml-2 text-gray-300">Loading AI Model...</span>
      </div>
    )
  }
);

export default ClientInferenceProvider;
