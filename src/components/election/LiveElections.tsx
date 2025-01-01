// src/components/election/LiveElections.tsx
"use client";

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Vote, Crown, Users, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ElectionData {
    type: 'new_election' | 'election_ended';
    signature: string;
    blockTime: number;
    accounts: {
        election: string;
        authority: string;
    };
    status?: 'active' | 'ended';
    votesCount?: number;
}

export function LiveElections() {
    const router = useRouter();
    const [elections, setElections] = useState<ElectionData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        const wsConnection = new WebSocket('wss://fd6d-197-211-59-134.ngrok-free.app');
        setWs(wsConnection);

        wsConnection.onopen = () => {
            console.log('✅ Connected to voting WebSocket');
            setIsConnected(true);
            wsConnection.send(JSON.stringify({ type: 'subscribe', channel: 'elections' }));
        };

        wsConnection.onmessage = (event) => {
            try {
                const { channel, data } = JSON.parse(event.data);
                console.log(`📩 Received message on channel ${channel}:`, data);

                if (channel === 'elections') {
                    if (data.type === 'new_election') {
                        setElections(prev => [{...data, status: 'active', votesCount: 0}, ...prev]);
                    } else if (data.type === 'election_ended') {
                        setElections(prev => prev.map(election => 
                            election.accounts.election === data.accounts.election 
                                ? { ...election, status: 'ended' } 
                                : election
                        ));
                    }
                }
            } catch (error) {
                console.error('❌ Error handling WebSocket message:', error);
            }
        };

        wsConnection.onclose = () => {
            console.log('🔌 WebSocket connection closed');
            setIsConnected(false);
        };

        wsConnection.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            wsConnection.close();
        };
    }, []);

    const handleElectionClick = (election: ElectionData) => {
        console.log('🗳️ Election clicked:', election);
        router.push(`/election/${election.accounts.election}`);
    };

    if (!isConnected || elections.length === 0) {
        return (
            <div className="p-8 border border-dashed border-purple-500/20 rounded-lg text-center 
                           bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                <p className="text-purple-500">
                    {!isConnected ? 'Connecting to election updates...' : 'No active elections at the moment'}
                </p>
            </div>
        );
    }

    return (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="grid gap-4 pr-2">
                {elections.map((election) => (
                    <div 
                        key={election.signature}
                        onClick={() => handleElectionClick(election)}
                        className="p-4 bg-gradient-to-r from-purple-50/90 to-pink-50/90 
                                 rounded-lg border border-purple-500/20 backdrop-blur-sm
                                 hover:shadow-md hover:border-purple-500/30 transition-all duration-300
                                 group cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-transparent bg-clip-text 
                                                 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-2">
                                        {election.status === 'ended' ? (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                        {election.status === 'ended' ? 'Ended Election' : 'Active Election'}
                                    </h3>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm text-purple-900/70">
                                    <Crown className="h-4 w-4" />
                                    <p className="truncate">
                                        {election.accounts.authority.slice(0, 4)}...{election.accounts.authority.slice(-4)}
                                    </p>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm text-purple-900/70">
                                    <Vote className="h-4 w-4" />
                                    <p className="truncate">
                                        {election.accounts.election.slice(0, 4)}...{election.accounts.election.slice(-4)}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right space-y-1">
                                <span className="text-xs text-gray-500">
                                    {format(new Date(election.blockTime * 1000), 'MMM d, HH:mm:ss')}
                                </span>
                                {election.votesCount !== undefined && (
                                    <div className="flex items-center justify-end text-xs text-purple-600">
                                        <Users className="h-3 w-3 mr-1" />
                                        {election.votesCount} votes
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-purple-100 hidden group-hover:block">
                            <p className="text-xs text-purple-600">Click to view details</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}