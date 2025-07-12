import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  
  // Since we're using ONNX Runtime Web, inference should be done on the client side
  // This API route is now just for validation or other server-side operations
  // The actual inference will be handled by the client-side code
  
  return NextResponse.json({ 
    message: 'Please use client-side inference with ONNX Runtime Web',
    text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  });
}
