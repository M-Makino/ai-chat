'use client';

import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const { messages, streamingContent, isStreaming, error, sendMessage, stopStreaming } = useChat();

  return (
    <div className="flex flex-col h-full">
      <ChatWindow messages={messages} streamingContent={streamingContent} error={error} />
      <MessageInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={isStreaming}
      />
    </div>
  );
}
