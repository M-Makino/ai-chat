import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/Message';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

const PAGE_SIZE = 50;

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: '不正なIDです' }, { status: 400 });
    }
    await dbConnect();

    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');

    // limit 未指定 → 全件返却（後方互換）
    if (!limitParam) {
      const messages = await Message.find({ conversationId: id })
        .sort({ createdAt: 1 })
        .lean();
      return NextResponse.json(messages);
    }

    // limit 指定 → ページネーションレスポンス { messages, hasMore }
    const limit = Math.min(parseInt(limitParam, 10) || PAGE_SIZE, 100);
    const before = url.searchParams.get('before');

    const query: Record<string, unknown> = { conversationId: id };
    if (before && mongoose.isValidObjectId(before)) {
      const ref = await Message.findById(before).select('createdAt').lean();
      if (ref) query.createdAt = { $lt: ref.createdAt };
    }

    // 新しい順に取得してから反転（最新N件を時系列順で返す）
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    messages.reverse();

    // これより古いメッセージが存在するか確認
    const hasMore =
      messages.length > 0
        ? (await Message.countDocuments({
            conversationId: id,
            createdAt: { $lt: messages[0].createdAt },
          })) > 0
        : false;

    return NextResponse.json({ messages, hasMore });
  } catch {
    return NextResponse.json({ error: 'メッセージの取得に失敗しました' }, { status: 500 });
  }
}
