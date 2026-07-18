import { buildPublicSnapshot } from "@/lib/fetchers";

export const revalidate = 21_600;

export async function GET() {
  const snapshot = await buildPublicSnapshot(new Date());
  return Response.json(snapshot, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=900",
      "X-Data-Refresh": "six-hour-window"
    }
  });
}
