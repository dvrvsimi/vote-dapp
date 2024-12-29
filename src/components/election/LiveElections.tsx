// src/components/election/LiveElections.tsx
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ElectionData {
    type: 'new_election' | 'election_ended';
    signature: string;
    election: string;
    authority: string;
    timestamp: string;
    status?: 'active' | 'ended';
}

class VoteWebSocketManager {
    private url: string;
    private ws: WebSocket | null;
    private eventHandlers: Map<string, Set<(data: ElectionData) => void>>;

    constructor(url: string = 'ws://localhost:3001') {
        this.url = url;
        this.ws = null;
        this.eventHandlers = new Map();
        this.connect();
    }

    private connect(): void {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('Connected to voting WebSocket server');
            this.eventHandlers.forEach((_, channel) => {
                this.subscribe(channel);
            });
        };

        this.ws.onmessage = (event) => {
            try {
                const { channel, data } = JSON.parse(event.data) as {
                    channel: string;
                    data: ElectionData;
                };
                const handlers = this.eventHandlers.get(channel);
                handlers?.forEach(handler => handler(data));
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed. Reconnecting...');
            setTimeout(() => this.connect(), 3000);
        };
    }

    public subscribe(channel: string, handler?: (data: ElectionData) => void): void {
        if (!this.eventHandlers.has(channel)) {
            this.eventHandlers.set(channel, new Set());
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
            }
        }
        if (handler) {
            this.eventHandlers.get(channel)?.add(handler);
        }
    }

    public unsubscribe(channel: string, handler?: (data: ElectionData) => void): void {
        const handlers = this.eventHandlers.get(channel);
        if (handlers) {
            if (handler) {
                handlers.delete(handler);
            }
            if (!handler || handlers.size === 0) {
                this.eventHandlers.delete(channel);
                if (this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
                }
            }
        }
    }
}

export const wsManager = new VoteWebSocketManager();

export function LiveElections() {
    const [elections, setElections] = useState<ElectionData[]>([]);

    useEffect(() => {
        const handleElectionEvent = (data: ElectionData) => {
            if (data.type === 'new_election') {
                setElections(prev => [{...data, status: 'active'}, ...prev]);
            } else if (data.type === 'election_ended') {
                setElections(prev => prev.map(election => 
                    election.election === data.election 
                        ? { ...election, status: 'ended' } 
                        : election
                ));
            }
        };

        wsManager.subscribe('elections', handleElectionEvent);

        return () => {
            wsManager.unsubscribe('elections', handleElectionEvent);
        };
    }, []);

    if (elections.length === 0) {
        return (
            <div className="p-8 border border-dashed border-purple-500/20 rounded-lg text-center text-purple-500">
                No active elections at the moment
            </div>
        );
    }

    return (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="grid gap-4 pr-2">
                {elections.map((election) => (
                    <div 
                        key={election.signature}
                        className="p-4 bg-gradient-to-r from-purple-50/90 to-pink-50/90 
                                 rounded-lg border border-purple-500/20 backdrop-blur-sm
                                 hover:shadow-md hover:border-purple-500/30 transition-all duration-300"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-transparent bg-clip-text 
                                             bg-gradient-to-r from-purple-600 to-pink-600">
                                    {election.status === 'ended' ? 'Ended' : 'Active'} Election
                                </h3>
                                <p className="text-sm text-purple-900/70 truncate">
                                    Address: {election.election}
                                </p>
                                <p className="text-sm text-purple-900/70">
                                    Created by: {election.authority}
                                </p>
                            </div>
                            <span className="text-xs text-gray-500">
                                {format(new Date(election.timestamp), 'MMM d, HH:mm:ss')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}