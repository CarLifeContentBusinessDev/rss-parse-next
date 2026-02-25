export function formatDateYYMMDD(pubDate?: string) {
  if (!pubDate) return null;

  const d = new Date(pubDate);
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");

  return `${yy}.${mm}.${dd}`;
}

export function formatDuration(duration?: string) {
  if (!duration) return null;

  const normalized = duration.trim();
  if (/^\d+$/.test(normalized)) {
    const totalSeconds = Number.parseInt(normalized, 10);
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
      return null;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  const match = normalized.match(/^(\d{1,2}:){1,2}\d{1,2}$/);
  if (!match) return null;

  const parts = normalized.split(":");
  if (parts.length === 3 && parts[0] === "00") {
    const [, rawMm = "0", rawSs = "0"] = parts;
    return `${rawMm.padStart(2, "0")}:${rawSs.padStart(2, "0")}`;
  }

  if (parts.length === 2) {
    const [rawMm = "0", rawSs = "0"] = parts;
    return `${rawMm.padStart(2, "0")}:${rawSs.padStart(2, "0")}`;
  }

  const [rawHh = "0", rawMm = "0", rawSs = "0"] = parts;
  return `${rawHh.padStart(2, "0")}:${rawMm.padStart(2, "0")}:${rawSs.padStart(2, "0")}`;
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Retry failed");
}
