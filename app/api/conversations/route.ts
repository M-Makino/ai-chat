import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await dbConnect();
    const conversations = await Conversation.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: '会話一覧の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    await dbConnect();
    const conversation = await Conversation.create({ title: title ?? '新しい会話' });
    return NextResponse.json(conversation, { status: 201 });
  } catch {
    return NextResponse.json({ error: '会話の作成に失敗しました' }, { status: 500 });
  }
}
