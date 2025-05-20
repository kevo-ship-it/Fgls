import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let message = `HTTP error! status: ${res.status}`;
    try {
      const data = await res.json();
      if (data.message) {
        message = data.message;
      }
    } catch (e) {
      // Ignore JSON parsing error
    }
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  headers?: HeadersInit
) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => ({ queryKey }: { queryKey: string[] }) => Promise<T | null> =
  (options) =>
  async ({ queryKey }) => {
    const [path] = queryKey;
    try {
      const response = await fetch(path, {
        credentials: "include",
      });

      if (response.status === 401) {
        if (options.on401 === "throw") {
          throw new Error("Not authorized");
        }
        return null;
      }

      await throwIfResNotOk(response);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
