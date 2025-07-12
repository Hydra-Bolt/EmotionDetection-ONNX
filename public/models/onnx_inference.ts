import * as ort from 'onnxruntime-web';
import { loadTokenizer, CLS_INDEX, SEP_INDEX } from '../../bert_tokenizer';

// Path to the int8 ONNX model (from public directory for web access)
const MODEL_PATH = '/models/classifier_int8.onnx';

// Cache for the ONNX session to avoid reloading the model each time
let cachedSession: ort.InferenceSession | null = null;

async function getOrCreateSession(): Promise<ort.InferenceSession> {
  if (!cachedSession) {
    console.log('Loading ONNX model from:', MODEL_PATH);
    
    // Configure execution providers for server-side web runtime
    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: ['wasm'],
      logSeverityLevel: 0,
      logVerbosityLevel: 0,
    };
    
    // Set WASM path for server-side usage
    if (typeof window === 'undefined') {
      // Server-side: use relative path to public directory
      ort.env.wasm.wasmPaths = './public/static/onnx-wasm/';
    } else {
      // Client-side: use absolute path
      ort.env.wasm.wasmPaths = '/static/onnx-wasm/';
    }
    ort.env.wasm.numThreads = 1; // Disable multi-threading for better compatibility
    ort.env.wasm.simd = true; // Enable SIMD if available
    
    // For web, we need to fetch the model as ArrayBuffer
    const response = await fetch(MODEL_PATH);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status}`);
    }
    const modelArrayBuffer = await response.arrayBuffer();
    cachedSession = await ort.InferenceSession.create(modelArrayBuffer, options);
    console.log('Model loaded successfully. Inputs:', cachedSession.inputNames, 'Outputs:', cachedSession.outputNames);
  }
  return cachedSession;
}

export async function runInference(text: string) {
  console.log('Starting inference for text:', text.substring(0, 50) + '...');
  
  // Load tokenizer and tokenize input
  const tokenizer = await loadTokenizer();
  let inputIds = tokenizer.tokenize(text);

  // Add [CLS] and [SEP] tokens
  inputIds = [CLS_INDEX, ...inputIds, SEP_INDEX];

  // Pad or truncate to fixed length (e.g., 128)
  const maxLen = 128;
  if (inputIds.length > maxLen) {
    inputIds = inputIds.slice(0, maxLen);
  } else {
    while (inputIds.length < maxLen) {
      inputIds.push(0); // pad with 0
    }
  }

  // Prepare input for ONNX model (onnxruntime-web uses different tensor creation)
  const inputTensor = new ort.Tensor('int64', new BigInt64Array(inputIds.map(id => BigInt(id))), [1, maxLen]);
  
  // Create attention mask (1 for real tokens, 0 for padding)
  const attentionMask = inputIds.map(id => id === 0 ? 0 : 1);
  const attentionMaskTensor = new ort.Tensor('int64', new BigInt64Array(attentionMask.map(id => BigInt(id))), [1, maxLen]);
  
  // Create token type ids (all 0s for single sentence classification)
  const tokenTypeIds = new Array(maxLen).fill(0);
  const tokenTypeIdsTensor = new ort.Tensor('int64', new BigInt64Array(tokenTypeIds.map(id => BigInt(id))), [1, maxLen]);

  // Load ONNX model (cached)
  const session = await getOrCreateSession();

  // Prepare feeds (input name may vary, adjust as needed)
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = inputTensor;
  
  // Add attention mask and token type ids if the model expects them
  if (session.inputNames.length > 1) {
    feeds[session.inputNames[1]] = attentionMaskTensor;
  }
  if (session.inputNames.length > 2) {
    feeds[session.inputNames[2]] = tokenTypeIdsTensor;
  }

  // Run inference
  const results = await session.run(feeds);
  // Assume output is the first output
  const output = results[session.outputNames[0]];
  return output.data;
}
