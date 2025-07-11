"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InferPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main page immediately
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-white text-xl">Redirecting to Emotion Detector...</p>
      </div>
    </div>
  );
}
