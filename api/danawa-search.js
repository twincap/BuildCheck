import { handleDanawaSearchRequest } from "../server/danawaSearch.mjs";

export default async function handler(request, response) {
  try {
    const items = await handleDanawaSearchRequest(request.url);
    response.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    response.status(200).json({ items });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Danawa search failed" });
  }
}
