"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCw, X } from "lucide-react";
import { boardRequest, type BoardMessage } from "@/lib/board";
export default function AnonymousBoard({
  onClose,
  refreshKey = 0,
  visible,
}: {
  onClose: () => void;
  refreshKey?: number;
  visible: boolean;
}) {
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const data = await boardRequest<{ messages: BoardMessage[] }>(
        "/messages",
        { signal },
      );
      if (!signal?.aborted) setMessages(data.messages.slice(0, 7).reverse());
    } catch (err) {
      if (!signal?.aborted)
        setError(
          err instanceof Error
            ? err.message
            : "The board is resting. Try again shortly.",
        );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey, visible]);
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);
  return (
    <aside
      className={`anonymous-board ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
      inert={!visible}
      aria-label="Anonymous message board"
    >
      <div
        className="board-messages"
        ref={list}
        aria-live={visible ? "polite" : "off"}
        aria-label="Latest seven anonymous messages"
      >
        {loading && !messages.length ? (
          <p className="board-empty">Finding a few words…</p>
        ) : error && !messages.length ? (
          <div className="board-empty">
            <p role="status">{error}</p>
            <button className="text-button" onClick={() => void load()}>
              Try again
            </button>
          </div>
        ) : messages.length ? (
          messages.map((message, index) => (
            <p
              className="board-note"
              key={message.id}
              style={{ opacity: [1, .85, .7, .54, .4, .27, .16][messages.length - 1 - index] }}
            >
              <span className="chat-dot" aria-hidden="true" />
              {message.body}
            </p>
          ))
        ) : (
          <div className="board-empty">
            <MessageCircle size={24} strokeWidth={1} />
            <p>
              It’s quiet here.
              <br />
              Your note could be the first.
            </p>
          </div>
        )}
      </div>
      <footer className="board-footer">
        <span>anonymous thoughts</span>
        <button
          className="icon-button"
          disabled={loading}
          aria-label="Refresh message board"
          onClick={() => void load()}
        >
          <RefreshCw size={14} />
        </button>
        <button type="button" className="icon-button" aria-label="Hide message board" onClick={onClose}>
          <X size={13} />
        </button>
      </footer>
    </aside>
  );
}
