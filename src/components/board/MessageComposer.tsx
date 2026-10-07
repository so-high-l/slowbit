"use client";
import { useRef, useState, type FormEvent } from "react";
import { Check, MessageCircle } from "lucide-react";
import {
  boardRequest,
  MAX_MESSAGE_LENGTH,
  validateMessage,
  type BoardMessage,
} from "@/lib/board";
export default function MessageComposer({
  onPosted,
}: {
  onPosted: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const token = useRef<string | null>(null);
  const submitting = useRef(false);
  const length = Array.from(body).length;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || posted) return;
    setError("");
    let note: string;
    try {
      note = validateMessage(body);
    } catch (err) {
      setError((err as Error).message);
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      if (!token.current) {
        const session = await boardRequest<{ token: string }>("/session", {
          method: "POST",
          body: "{}",
        });
        token.current = session.token;
      }
      await boardRequest<{ message: BoardMessage }>("/messages", {
        method: "POST",
        body: JSON.stringify({ body: note, token: token.current }),
      });
      setPosted(true);
      setBody("");
      onPosted();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your note is still here. Please try again.",
      );
    } finally {
      setPending(false);
      submitting.current = false;
    }
  }
  if (posted)
    return (
      <div className="note-sent" role="status">
        <span>
          <Check size={18} />
        </span>
        <div>
          <h2>A little kindness, left behind.</h2>
          <p>Your anonymous note is on the board.</p>
        </div>
      </div>
    );
  return (
    <form className="message-composer" onSubmit={submit}>
      <label htmlFor="anonymous-note">
        <MessageCircle size={16} /> Leave a thought behind
      </label>
      <div className="note-field">
        <textarea
          id="anonymous-note"
          placeholder="Something you’re letting go of. A kind word for the next person…"
          rows={3}
          maxLength={560}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
          aria-describedby="note-audience note-error"
        />
        <div className="note-field-footer">
          <span className={length > MAX_MESSAGE_LENGTH ? "over-limit" : ""}>
            {length} / {MAX_MESSAGE_LENGTH}
          </span>
          <button
            type="submit"
            disabled={pending || !body.trim() || length > MAX_MESSAGE_LENGTH}
          >
            {pending ? "Leaving your note…" : "Leave anonymously"}
          </button>
        </div>
      </div>
      <p id="note-audience">
        Shared with everyone who opens the board. No name or profile.
      </p>
      {error && (
        <p className="note-error" id="note-error" role="alert">
          {error} Your draft stays here.
        </p>
      )}
    </form>
  );
}
