'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Message } from '@/types';

export function useChat(conversationId?: string) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async (id: string) => {
    setIsLoadingMessages(true);
    setMessages([]);
    setHasMoreMessages(false);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${id}/messages?limit=50`);
      if (res.ok) {
        const data = (await res.json()) as { messages: Message[]; hasMore: boolean };
        setMessages(data.messages);
        setHasMoreMessages(data.hasMore);
      } else {
        setError('メッセージの取得に失敗しました');
      }
    } catch {
      setError('メッセージの取得に失敗しました');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || messages.length === 0 || isLoadingMore) return;
    const oldestId = messages[0]._id;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=50&before=${oldestId}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { messages: Message[]; hasMore: boolean };
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, messages, isLoadingMore]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      setIsStreaming(true);
      setStreamingContent('');
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setMessages((prev) => [
        ...prev,
        {
          _id: `temp-${Date.now()}`,
          conversationId: conversationId ?? '',
          role: 'user' as const,
          content,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, content }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? 'サーバーエラーが発生しました');
        }

        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let newConversationId = conversationId;
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line) as {
                type: string;
                conversationId?: string;
                text?: string;
                title?: string;
                message?: string;
              };
              switch (event.type) {
                case 'meta':
                  newConversationId = event.conversationId;
                  break;
                case 'delta':
                  fullResponse += event.text ?? '';
                  setStreamingContent(fullResponse);
                  break;
                case 'title':
                  // タイトル生成完了 — サイドバーは navigate 後に自動リフレッシュするので無処理
                  break;
                case 'error':
                  throw new Error(event.message ?? 'ストリームエラー');
                case 'done':
                  setMessages((prev) => [
                    ...prev,
                    {
                      _id: `assistant-${Date.now()}`,
                      conversationId: newConversationId ?? '',
                      role: 'assistant' as const,
                      content: fullResponse,
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                  setStreamingContent('');
                  if (!conversationId && newConversationId) {
                    router.push(`/chat/${newConversationId}`);
                  }
                  break;
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.name !== 'SyntaxError') {
                throw parseErr;
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // ユーザーによる停止 — エラー表示なし
        } else {
          setError(err instanceof Error ? err.message : 'エラーが発生しました');
        }
        setStreamingContent('');
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId, router],
  );

  return {
    messages,
    setMessages,
    streamingContent,
    isStreaming,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    error,
    setError,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    stopStreaming,
  };
}
