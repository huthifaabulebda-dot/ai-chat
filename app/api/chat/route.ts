import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import jwt from 'jsonwebtoken';
import { appendMessages, clearMessages, getMessages } from '@/lib/memoryStore';

async function getAIResponse(message: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('missing_groq_api_key');
  }

  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify({ status: response.status, error: data?.error?.message || 'Groq API error' }));
  }

  return data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server is missing JWT_SECRET configuration.' }, { status: 500 });
  }

  let useMemoryStore = false;
  try {
    await dbConnect();
  } catch (error) {
    useMemoryStore = true;
    console.warn('MongoDB unavailable; using memory store for chat POST.', error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const aiResponse = await getAIResponse(message);

    if (useMemoryStore) {
      appendMessages(decoded.id, [
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse },
      ]);
      return NextResponse.json({ response: aiResponse });
    }

    let conversation = await Conversation.findOne({ userId: decoded.id });
    if (!conversation) {
      conversation = new Conversation({ userId: decoded.id, messages: [] });
    }
    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'assistant', content: aiResponse });
    await conversation.save();

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'missing_groq_api_key') {
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY in .env.local' },
        { status: 500 }
      );
    }
    if (error instanceof Error) {
      const messageText = error.message.toLowerCase();
      if (messageText.includes('429') || messageText.includes('quota') || messageText.includes('rate')) {
        return NextResponse.json(
          { error: 'Groq quota/rate limit exceeded. Please wait a bit and retry.' },
          { status: 429 }
        );
      }
      if (messageText.includes('404') || messageText.includes('not found')) {
        return NextResponse.json(
          { error: 'Selected Groq model was not found. Set GROQ_MODEL in .env.local.' },
          { status: 502 }
        );
      }
      if (messageText.includes('401') || messageText.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid GROQ_API_KEY. Please update your key in .env.local.' },
          { status: 401 }
        );
      }
    }
    console.error('Groq POST error:', error);
    return NextResponse.json({ error: 'Failed to process your message.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server is missing JWT_SECRET configuration.' }, { status: 500 });
  }

  let useMemoryStore = false;
  try {
    await dbConnect();
  } catch (error) {
    useMemoryStore = true;
    console.warn('MongoDB unavailable; using memory store for chat GET.', error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    if (useMemoryStore) {
      return NextResponse.json({ messages: getMessages(decoded.id) });
    }

    const conversation = await Conversation.findOne({ userId: decoded.id });
    const messages = conversation ? conversation.messages : [];

    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server is missing JWT_SECRET configuration.' }, { status: 500 });
  }

  let useMemoryStore = false;
  try {
    await dbConnect();
  } catch (error) {
    useMemoryStore = true;
    console.warn('MongoDB unavailable; using memory store for chat DELETE.', error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    if (useMemoryStore) {
      clearMessages(decoded.id);
      return NextResponse.json({ success: true });
    }

    await Conversation.findOneAndUpdate(
      { userId: decoded.id },
      { $set: { messages: [] } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Chat DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear chat.' }, { status: 500 });
  }
}