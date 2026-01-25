const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return "/api";
  }
  const baseUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  if (!baseUrl.endsWith("/api")) {
    return `${baseUrl}/api`;
  }
  return baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

export interface BrandsResponse {
  success: boolean;
  count: number;
  data: string[];
  timestamp: string;
  source?: string;
}

export async function fetchBrands(): Promise<string[]> {
  const url = `${API_BASE_URL}/brands`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch brands: ${response.status} ${errorText}`);
  }

  const data: BrandsResponse = await response.json();
  if (!data.success) {
    throw new Error("Brands API returned unsuccessful response");
  }

  return data.data;
}
