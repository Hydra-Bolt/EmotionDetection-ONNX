'use client';

import * as ort from 'onnxruntime-web';
import { loadTokenizer, CLS_INDEX, SEP_INDEX } from '../../bert_tokenizer';

// Path to the int8 ONNX model (from public directory for web access)
const MODEL_PATH = '/models/classifier_int8.onnx';

// Cache for the ONNX session to avoid reloading the model each time
let cachedSession: ort.InferenceSession | null = null;

async function getOrCreateSession(): Promise<ort.InferenceSession> {
  if (!cachedSession) {
    console.log('Loading ONNX model from:', MODEL_PATH);
    
    // Configure execution providers for web - prefer WebAssembly
    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: ['wasm'], // Use WebAssembly execution provider
      logSeverityLevel: 2, // Warning level
      logVerbosityLevel: 0,
      // Additional web-specific options
      enableCpuMemArena: false, // Disable memory arena for better memory management
      enableMemPattern: false, // Disable memory pattern optimization
    };
    
    try {
      // Fetch the model as ArrayBuffer
      console.log('Fetching model from:', MODEL_PATH);
      const response = await fetch(MODEL_PATH);
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
      }
      
      const modelArrayBuffer = await response.arrayBuffer();
      console.log('Model fetched successfully, size:', modelArrayBuffer.byteLength, 'bytes');
      
      // Create the inference session
      cachedSession = await ort.InferenceSession.create(modelArrayBuffer, options);
      console.log('Model loaded successfully.');
      console.log('Input names:', cachedSession.inputNames);
      console.log('Output names:', cachedSession.outputNames);
      
    } catch (error) {
      console.error('Error loading model:', error);
      throw new Error(`Failed to load ONNX model: ${error}`);
    }
  }
  return cachedSession;
}

export async function runClientInference(text: string) {
  console.log('Starting client-side inference for text:', text.substring(0, 50) + '...');
  
  try {
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

    console.log('Input IDs prepared, length:', inputIds.length);

    // Prepare input tensors for ONNX model
    const inputTensor = new ort.Tensor('int64', new BigInt64Array(inputIds.map(id => BigInt(id))), [1, maxLen]);
    
    // Create attention mask (1 for real tokens, 0 for padding)
    const attentionMask = inputIds.map(id => id === 0 ? 0 : 1);
    const attentionMaskTensor = new ort.Tensor('int64', new BigInt64Array(attentionMask.map(id => BigInt(id))), [1, maxLen]);
    
    // Create token type ids (all 0s for single sentence classification)
    const tokenTypeIds = new Array(maxLen).fill(0);
    const tokenTypeIdsTensor = new ort.Tensor('int64', new BigInt64Array(tokenTypeIds.map(id => BigInt(id))), [1, maxLen]);

    // Load ONNX model (cached)
    const session = await getOrCreateSession();

    // Prepare feeds based on model inputs
    const feeds: Record<string, ort.Tensor> = {};
    
    // Map inputs based on actual model input names
    const inputNames = session.inputNames;
    console.log('Model expects inputs:', inputNames);
    
    // Common BERT input patterns
    if (inputNames.includes('input_ids') || inputNames.includes('inputs')) {
      feeds[inputNames.find(name => name.includes('input')) || inputNames[0]] = inputTensor;
    } else {
      feeds[inputNames[0]] = inputTensor;
    }
    
    // Add attention mask if model expects it
    if (inputNames.length > 1) {
      const attentionMaskName = inputNames.find(name => name.includes('attention') || name.includes('mask'));
      if (attentionMaskName) {
        feeds[attentionMaskName] = attentionMaskTensor;
      } else {
        feeds[inputNames[1]] = attentionMaskTensor;
      }
    }
    
    // Add token type ids if model expects it
    if (inputNames.length > 2) {
      const tokenTypeIdsName = inputNames.find(name => name.includes('token_type') || name.includes('type'));
      if (tokenTypeIdsName) {
        feeds[tokenTypeIdsName] = tokenTypeIdsTensor;
      } else {
        feeds[inputNames[2]] = tokenTypeIdsTensor;
      }
    }

    console.log('Running inference with feeds:', Object.keys(feeds));

    // Run inference
    const results = await session.run(feeds);
    
    // Get output - assume first output contains the logits
    const outputName = session.outputNames[0];
    const output = results[outputName];
    
    console.log('Inference completed. Output shape:', output.dims, 'Type:', output.type);
    
    // Return the data as array
    return Array.from(output.data as Float32Array);
    
  } catch (error) {
    console.error('Error during inference:', error);
    throw new Error(`Inference failed: ${error}`);
  }
}

// Initialize ONNX runtime for web
export async function initializeONNXRuntime() {
  try {
    // Set the path for ONNX runtime WASM files
    ort.env.wasm.wasmPaths = '/static/onnx-wasm/';
    ort.env.wasm.numThreads = 1; // Use single thread for better compatibility
    ort.env.wasm.simd = true; // Enable SIMD if available
    
    // Additional web-specific configurations
    ort.env.wasm.proxy = false; // Disable proxy mode for direct WASM usage
    ort.env.logLevel = 'warning'; // Reduce log verbosity
    
    console.log('ONNX Runtime Web initialized with configuration:', {
      wasmPaths: ort.env.wasm.wasmPaths,
      numThreads: ort.env.wasm.numThreads,
      simd: ort.env.wasm.simd
    });
  } catch (error) {
    console.error('Failed to initialize ONNX Runtime Web:', error);
    throw error;
  }
}
