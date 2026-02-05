const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "/api";
  const baseUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  if (!baseUrl.endsWith("/api")) return `${baseUrl}/api`;
  return baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

export async function recordVisit(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/stats/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error("recordVisit failed");
}

export async function fetchActiveVisitorCount(): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/stats/active-visitors`);
  if (!res.ok) return 0;
  const data = await res.json();
  return typeof data?.count === "number" ? data.count : 0;
}
