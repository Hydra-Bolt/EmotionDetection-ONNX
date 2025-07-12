import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Handle .onnx files
    config.module.rules.push({
      test: /\.onnx$/,
      use: 'file-loader',
    });
    
    // ONNX Runtime Web specific configurations
    if (!isServer) {
      // Client-side configurations for ONNX Runtime Web
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
      
      // Ensure WASM files are properly handled
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      });
    }
    
    // Exclude onnxruntime-web from server-side bundling
    if (isServer) {
      config.externals = [...(config.externals || []), 'onnxruntime-web'];
    }
    
    return config;
  },
  async headers() {
    return [
      {
        // Enable proper CORS and security headers for ONNX WASM files
        source: '/static/onnx-wasm/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Enable proper headers for model files
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
