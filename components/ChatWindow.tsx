'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';

interface ChatWindowProps {
  messages: Message[];
  streamingContent?: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadMore?: () => void;
  error?: string | null;
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre({ children }) {
          return (
            <pre className="bg-gray-800 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs my-2 font-mono">
              {children}
            </pre>
          );
        },
        code({ className, children }) {
          const isBlock = !!className;
          if (isBlock) return <code className={className}>{children}</code>;
          return (
            <code className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 text-xs font-mono">
              {children}
            </code>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
        },
        h1({ children }) {
          return <h1 className="text-xl font-bold mb-2 mt-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-base font-bold mb-1 mt-2">{children}</h3>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-gray-400 pl-3 italic text-gray-600 my-2">
              {children}
            </blockquote>
          );
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function ChatWindow({
  messages,
  streamingContent,
  isLoading,
  isLoadingMore,
  hasMoreMessages,
  onLoadMore,
  error,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div
              className="h-12 rounded-2xl bg-gray-200 animate-pulse"
              style={{ width: `${40 + i * 15}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0 && !streamingContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        <p className="text-gray-400 text-sm">メッセージを入力して会話を始めましょう</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {/* 過去メッセージ読み込みボタン */}
      {hasMoreMessages && (
        <div className="flex justify-center pb-2">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-full px-4 py-1.5 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? '読み込み中...' : '過去のメッセージを読み込む'}
          </button>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
          {error}
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg._id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className="group max-w-[75%]">
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white whitespace-pre-wrap'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.role === 'assistant' ? <MarkdownContent content={msg.content} /> : msg.content}
            </div>
            {msg.role === 'assistant' && (
              <button
                onClick={() => handleCopy(msg._id, msg.content)}
                className="mt-1 text-xs text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedId === msg._id ? '✓ コピー済み' : 'コピー'}
              </button>
            )}
          </div>
        </div>
      ))}

      {streamingContent !== undefined && streamingContent !== '' && (
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-gray-100 text-gray-800">
            <MarkdownContent content={streamingContent} />
            <span className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 animate-pulse align-middle" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
