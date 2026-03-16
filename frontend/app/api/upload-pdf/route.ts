import { NextRequest, NextResponse } from 'next/server';

// Re-export the backend app
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([buffer], { type: file.type }), file.name);

    // Call the Python backend
    const response = await fetch('https://your-vercel-domain.vercel.app/upload-pdf/', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
