export interface BoardMessage {
  id: string;
  body: string;
  createdAt: number;
}
export const MAX_MESSAGE_LENGTH = 280;
export function validateMessage(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Write a little something first.");
  const body = value.trim().replace(/\r\n?/g, "\n");
  if (!body) throw new Error("Write a little something first.");
  if (Array.from(body).length > MAX_MESSAGE_LENGTH)
    throw new Error("Keep your note to 280 characters.");
  if (
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(
      body,
    )
  )
    throw new Error("Please remove unsupported characters from your note.");
  return body;
}
export async function boardRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const boardApiUrl = (process.env.NEXT_PUBLIC_BOARD_API_URL ?? "").replace(/\/+$/, "");
  const response = await fetch(`${boardApiUrl}/api/board${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)])
      : AbortSignal.timeout(12000),
  });
  let data: { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("The board is unavailable right now. Please try again.");
  }
  if (!response.ok)
    throw new Error(
      data.error ?? "The board is unavailable right now. Please try again.",
    );
  return data as T;
}
