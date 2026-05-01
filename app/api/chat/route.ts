import { dbConnect } from '@/lib/mongodb';
import { getAnthropicClient, generateTitle, SYSTEM_PROMPT } from '@/lib/claude';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { conversationId, content }: { conversationId?: string; content: string } =
      await req.json();

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: 'メッセージが空です' }), { status: 400 });
    }

    await dbConnect();

    const isNewConversation = !conversationId;
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return new Response(JSON.stringify({ error: '会話が見つかりません' }), { status: 404 });
      }
    } else {
      conversation = await Conversation.create({
        title: content.trim().slice(0, 30),
      });
    }

    await Message.create({ conversationId: conversation._id, role: 'user', content });

    const allHistory = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    // コンテキストウィンドウ超過を防ぐため直近50件に制限
    const history = allHistory.slice(-50);

    const stream = getAnthropicClient().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: 'meta', conversationId: conversation._id.toString() }) + '\n',
            ),
          );

          stream.on('text', (text) => {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'delta', text }) + '\n'),
            );
          });

          stream.on('error', (err) => {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'error', message: err.message }) + '\n'),
            );
            controller.close();
          });

          await stream.finalMessage();

          await Message.create({
            conversationId: conversation._id,
            role: 'assistant',
            content: fullResponse,
          });

          await Conversation.findByIdAndUpdate(conversation._id, { updatedAt: new Date() });

          // 新規会話: Claudeでタイトルを生成してDBを更新してから 'done' を送信
          if (isNewConversation) {
            const generatedTitle = await generateTitle(content);
            await Conversation.findByIdAndUpdate(conversation._id, { title: generatedTitle });
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'title', title: generatedTitle }) + '\n'),
            );
          }

          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'ストリームエラー';
          try {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'error', message }) + '\n'),
            );
          } catch {
            // controller が既に閉じている場合は無視
          }
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Conversation-Id': conversation._id.toString(),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'サーバーエラーが発生しました' }), {
      status: 500,
    });
  }
}
