'use client';

import { use, useEffect } from 'react';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import { useChat } from '@/hooks/useChat';

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    messages,
    streamingContent,
    isStreaming,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    error,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    stopStreaming,
  } = useChat(id);

  useEffect(() => {
    loadMessages(id);
  }, [id, loadMessages]);

  return (
    <div className="flex flex-col h-full">
      <ChatWindow
        messages={messages}
        streamingContent={streamingContent}
        isLoading={isLoadingMessages}
        isLoadingMore={isLoadingMore}
        hasMoreMessages={hasMoreMessages}
        onLoadMore={loadMoreMessages}
        error={error}
      />
      <MessageInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={isStreaming}
      />
    </div>
  );
}
