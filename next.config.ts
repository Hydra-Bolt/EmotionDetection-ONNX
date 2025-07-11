import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['onnxruntime-node', 'fs'],
  webpack: (config: any) => {
    // Handle .onnx files
    config.module.rules.push({
      test: /\.onnx$/,
      use: 'file-loader',
    });
    
    return config;
  },
};

export default nextConfig;
