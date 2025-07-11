import { NextRequest, NextResponse } from 'next/server';
import { runInference } from '../../../../onnx_inference';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  try {
    const output = await runInference(text);
    // Ensure output is a proper array
    const outputArray = Array.isArray(output) ? output : Array.from(output as any);
    console.log('API returning output:', outputArray);
    return NextResponse.json({ output: outputArray });
  } catch (err) {
    console.error('Inference error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
