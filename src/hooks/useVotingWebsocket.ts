// src/hooks/useVotingWebSocket.ts
import { useState, useEffect, useCallback } from 'react';

export interface Election {
  type: 'new_election' | 'election_ended';
  signature: string;
  election: string;
  authority: string;
  timestamp: string;
  status?: 'active' | 'ended';
  votesCount?: number;
}

interface Vote {
  type: string;
  signature: string;
  blockTime: number;
  timestamp: string;
  election: string;
  authority: string;
}

const WS_URL = 'wss://fd6d-197-211-59-134.ngrok-free.app';
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useVotingWebSocket() {
  const [elections, setElections] = useState<Election[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    console.log('🔄 Attempting to connect to WebSocket...');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to voting WebSocket');
      setIsConnected(true);
      setReconnectAttempts(0);
      
      // Subscribe to channels
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'elections' }));
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'votes' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📩 Received message:', message);
        
        switch (message.channel) {
          case 'elections':
            if (message.data.type === 'new_election') {
              setElections(prev => [{...message.data, status: 'active', votesCount: 0}, ...prev]);
            } else if (message.data.type === 'election_ended') {
              setElections(prev => prev.map(election => 
                election.election === message.data.election 
                  ? { ...election, status: 'ended' }
                  : election
              ));
            }
            break;
            
          case 'votes':
            setVotes(prev => [...prev, message.data]);
            // Update election vote count
            setElections(prev => prev.map(election => 
              election.election === message.data.election
                ? { ...election, votesCount: (election.votesCount || 0) + 1 }
                : election
            ));
            break;
        }
      } catch (error) {
        console.error('❌ Error handling message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
      setIsConnected(false);
      
      // Attempt to reconnect
      setReconnectAttempts(prev => prev + 1);
      setTimeout(() => connect(), RECONNECT_DELAY);
    };

    return () => {
      ws.close();
    };
  }, [reconnectAttempts]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    elections,
    votes,
    isConnected
  };
}