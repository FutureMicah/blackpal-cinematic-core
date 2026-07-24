import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Create a realtime channel with runtime verification that the caller can
 * only subscribe to a topic scoped to their own user id. Emits a console
 * warning + toast when scoping fails (channel error / timed out), which
 * happens when the server-side policy on realtime.messages rejects the
 * subscription because the topic ≠ auth.uid().
 *
 * Usage:
 *   const ch = createScopedChannel(userId, "wallet", (payload) => {...});
 *   return () => supabase.removeChannel(ch);
 */
export function createScopedChannel(
  userId: string,
  suffix: string,
  onPostgres?: {
    table: string;
    filter?: string;
    onEvent: (payload: any) => void;
    event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  },
): RealtimeChannel {
  // Topic MUST equal auth.uid()::text (see realtime.messages policy).
  const topic = userId;
  const channel = supabase.channel(topic);

  if (onPostgres) {
    channel.on(
      "postgres_changes" as any,
      {
        event: onPostgres.event ?? "*",
        schema: "public",
        table: onPostgres.table,
        ...(onPostgres.filter ? { filter: onPostgres.filter } : {}),
      },
      onPostgres.onEvent,
    );
  }

  channel.subscribe((status, err) => {
    if (status === "SUBSCRIBED") {
      // eslint-disable-next-line no-console
      console.info(`[realtime-scope] ok topic=${topic} suffix=${suffix}`);
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      // eslint-disable-next-line no-console
      console.error(
        `[realtime-scope] FAILED topic=${topic} suffix=${suffix} status=${status}`,
        err,
      );
      toast.error("Realtime scoping failed — updates paused", {
        description: "Your session may have expired; sign in again.",
        id: `rt-scope-${suffix}`,
      });
    }
  });

  return channel;
}
