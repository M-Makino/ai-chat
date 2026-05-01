import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: '不正なIDです' }, { status: 400 });
    }
    await dbConnect();
    const conversation = await Conversation.findById(id).lean();
    if (!conversation) {
      return NextResponse.json({ error: '会話が見つかりません' }, { status: 404 });
    }
    return NextResponse.json(conversation);
  } catch {
    return NextResponse.json({ error: '会話の取得に失敗しました' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: '不正なIDです' }, { status: 400 });
    }
    const { title } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'タイトルが空です' }, { status: 400 });
    }
    await dbConnect();
    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { title: title.trim() },
      { new: true },
    ).lean();
    if (!conversation) {
      return NextResponse.json({ error: '会話が見つかりません' }, { status: 404 });
    }
    return NextResponse.json(conversation);
  } catch {
    return NextResponse.json({ error: 'タイトルの更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: '不正なIDです' }, { status: 400 });
    }
    await dbConnect();
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json({ error: '会話が見つかりません' }, { status: 404 });
    }
    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);
    return NextResponse.json({ message: '削除しました' });
  } catch {
    return NextResponse.json({ error: '会話の削除に失敗しました' }, { status: 500 });
  }
}
