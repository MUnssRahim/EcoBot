import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'No question provided' },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.append('question', question);

    const response = await fetch('https://your-vercel-domain.vercel.app/ask-question/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Question error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Question failed' },
      { status: 500 }
    );
  }
}
