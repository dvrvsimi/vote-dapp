// hooks/useQuickNodeStream.ts
import { useEffect, useState, useCallback } from "react";
import { useProgram } from "./useProgram";
import { ElectionVoterStatusChanged, VoterRegistered } from "../types/vote";

export const useQuickNodeStream = (electionId?: string) => {
  const { connection } = useProgram();
  const [voterRegistrations, setVoterRegistrations] = useState<
    VoterRegistered[]
  >([]);
  const [statusChanges, setStatusChanges] = useState<
    ElectionVoterStatusChanged[]
  >([]);

  const subscribeToVoterEvents = useCallback(() => {
    if (!connection || !electionId) return;

    const wsEndpoint = process.env.NEXT_PUBLIC_QUICKNODE_WS_URL;
    const ws = new WebSocket(wsEndpoint!);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: "subscribe",
          params: [
            {
              topic: "VoterRegistered",
              filter: { electionId },
            },
            {
              topic: "ElectionVoterStatusChanged",
              filter: { electionId },
            },
          ],
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.topic === "VoterRegistered") {
        setVoterRegistrations((prev) => [...prev, data.data]);
      } else if (data.topic === "ElectionVoterStatusChanged") {
        setStatusChanges((prev) => [...prev, data.data]);
      }
    };

    return () => {
      ws.close();
    };
  }, [connection, electionId]);

  useEffect(() => {
    const unsubscribe = subscribeToVoterEvents();
    return () => {
      unsubscribe?.();
    };
  }, [subscribeToVoterEvents]);

  return {
    voterRegistrations,
    statusChanges,
  };
};
