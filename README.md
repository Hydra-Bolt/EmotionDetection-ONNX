# Emotion Detector 🎭

A modern web application that analyzes text and detects emotions using machine learning. Built with Next.js and ONNX Runtime, this app provides real-time emotion classification with a beautiful, animated user interface.

## ✨ Features

- **Real-time Emotion Detection**: Analyze text and detect 6 different emotions
- **Client-side ML Inference**: Runs entirely in the browser using ONNX Runtime Web
- **Beautiful UI**: Modern design with Framer Motion animations and Tailwind CSS
- **Fast Performance**: Optimized BERT model with int8 quantization
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Zero Backend Dependencies**: All processing happens in the browser

## 🎯 Supported Emotions

The model can detect the following emotions:
- 😢 **Sadness** - Blue gradient
- 😄 **Joy** - Yellow/Orange gradient  
- ❤️ **Love** - Pink/Rose gradient
- 😨 **Fear** - Purple gradient
- 😠 **Anger** - Red gradient
- 😲 **Surprise** - Green/Emerald gradient

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd emotion
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
emotion/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main emotion detector interface
│   │   ├── layout.tsx            # Root layout component
│   │   ├── globals.css           # Global styles
│   │   ├── api/
│   │   │   └── infer/
│   │   │       └── route.ts      # API route for inference
│   │   └── infer/
│   │       └── page.tsx          # Inference page (redirects to main)
│   └── lib/
│       ├── client-inference.ts    # Client-side ML inference logic
│       ├── client-inference-provider.tsx  # Inference context provider
│       └── client-only-inference.tsx     # Client-only components
├── public/
│   ├── models/
│   │   ├── classifier_int8.onnx  # Quantized BERT emotion classifier
│   │   └── onnx_inference.ts     # ONNX inference utilities
│   └── static/
│       ├── vocab.json            # BERT tokenizer vocabulary
│       └── onnx-wasm/           # ONNX Runtime WebAssembly files
├── bert_tokenizer.ts             # BERT tokenization logic
├── package.json
└── README.md
```

## 🔧 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **ML Runtime**: ONNX Runtime Web
- **Model**: Quantized BERT-based emotion classifier (int8)
- **Tokenization**: Custom BERT tokenizer implementation

## 🤖 How It Works

1. **Text Input**: User enters text in the input field
2. **Tokenization**: Text is tokenized using BERT tokenizer with vocabulary
3. **Model Inference**: Tokenized input is fed to the ONNX emotion classifier model
4. **Emotion Classification**: Model outputs probabilities for 6 emotion categories
5. **Results Display**: Emotions are displayed with confidence scores, colors, and animations

## 🎨 UI Features

- **Loading Animation**: Smooth loading indicators during model initialization
- **Progress Tracking**: Visual progress bar for model loading
- **Real-time Results**: Instant emotion detection as you type
- **Confidence Scores**: Visual representation of emotion confidence levels
- **Responsive Design**: Optimized for all screen sizes
- **Dark Theme**: Modern dark interface with gradient backgrounds

## 📊 Model Details

- **Architecture**: BERT-based transformer model
- **Quantization**: INT8 for faster inference and smaller model size
- **Input**: Text sequences up to 128 tokens
- **Output**: 6-class emotion probabilities
- **Performance**: Optimized for client-side inference

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Deploy on Other Platforms

The app can be deployed on any platform that supports Node.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Azure Static Web Apps

## 🔧 Configuration

### ONNX Runtime Settings

The ONNX runtime is configured in `src/lib/client-inference.ts`:

```typescript
// ONNX Runtime Web configuration
ort.env.wasm.wasmPaths = '/static/onnx-wasm/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;
ort.env.wasm.proxy = false;
```

### Model Path

Update the model path in `client-inference.ts` if needed:
```typescript
const MODEL_PATH = '/models/classifier_int8.onnx';
```

## 🐛 Troubleshooting

### Common Issues

1. **Model Loading Errors**: Ensure ONNX files are in the correct public directory
2. **WASM Loading Issues**: Check that ONNX WASM files are accessible
3. **Tokenization Errors**: Verify vocab.json is in the static directory
4. **Performance Issues**: Try reducing model precision or disabling SIMD

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support (may need WASM polyfills)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.
