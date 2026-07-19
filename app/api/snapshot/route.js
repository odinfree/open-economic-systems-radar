import { buildPublicSnapshot } from "@/lib/fetchers";
import { snapshotCacheControl } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await buildPublicSnapshot(new Date());
  return Response.json(snapshot, {
    status: 200,
    headers: {
      "Cache-Control": snapshotCacheControl(snapshot.meta.status),
      "X-Data-Refresh": "six-hour-window"
    }
  });
}
