'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Conversation } from '@/types';

async function fetchConversationList(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations');
  if (!res.ok) throw new Error('会話一覧の取得に失敗しました');
  return res.json();
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const activeId = pathname.startsWith('/chat/')
    ? pathname.replace('/chat/', '')
    : undefined;

  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setFetchError(null);
    fetchConversationList()
      .then((data) => { if (!cancelled) setConversations(data); })
      .catch((err) => { if (!cancelled) setFetchError(err instanceof Error ? err.message : '取得に失敗しました'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  // シングルクリック → ナビゲート、ダブルクリック → インライン編集
  const handleItemClick = (conv: Conversation) => {
    if (editingId) return;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setEditingId(conv._id);
      setEditTitle(conv.title);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        navigate(`/chat/${conv._id}`);
      }, 250);
    }
  };

  const saveEdit = async (id: string) => {
    const trimmed = editTitle.trim();
    setEditingId(null);
    if (!trimmed || trimmed === conversations.find((c) => c._id === id)?.title) return;
    await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, title: trimmed } : c)),
    );
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('この会話を削除しますか？')) return;
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    setConversations(await fetchConversationList());
    if (activeId === id) router.push('/chat');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 h-screen bg-gray-900 text-white flex flex-col flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-gray-700 space-y-2">
          <button
            onClick={() => navigate('/chat')}
            className="w-full py-2 px-4 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors text-sm text-left"
          >
            ＋ 新しい会話
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="会話を検索..."
            className="w-full px-3 py-1.5 rounded-lg bg-gray-800 text-sm text-gray-200 placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading && (
            <div className="space-y-1 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg bg-gray-700 animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && fetchError && (
            <p className="text-red-400 text-xs text-center mt-4 px-2">{fetchError}</p>
          )}
          {!isLoading && !fetchError && filtered.length === 0 && (
            <p className="text-gray-500 text-xs text-center mt-4">
              {searchQuery ? '一致する会話がありません' : '会話履歴がありません'}
            </p>
          )}
          {!isLoading && !fetchError && filtered.map((conv) => (
            <div
              key={conv._id}
              onClick={() => handleItemClick(conv)}
              title="ダブルクリックで名前変更"
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                activeId === conv._id
                  ? 'bg-gray-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              {editingId === conv._id ? (
                <input
                  ref={editInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveEdit(conv._id)}
                  onKeyDown={(e) => handleEditKeyDown(e, conv._id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
                />
              ) : (
                <span className="truncate text-sm flex-1">{conv.title}</span>
              )}
              {editingId !== conv._id && (
                <button
                  onClick={(e) => handleDelete(e, conv._id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 ml-2 text-xs transition-all flex-shrink-0"
                  title="削除"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
