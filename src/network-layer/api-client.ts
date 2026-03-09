export class ApiClient {
  get<T>(url: string): Promise<T> {
    console.log("[ApiClient] GET", url);

    return fetch(url)
      .then((response) => {
        console.log("[ApiClient] Response status:", response.status);

        if (!response.ok) {
          throw new Error("HTTP error: " + response.status);
        }

        return response.json() as Promise<T>;
      })
      .catch(function (error: unknown) {
        console.error("[ApiClient] Fetch failed:", error);
        throw error;
      });
  }
}
