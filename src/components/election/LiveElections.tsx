'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';

const RECONNECT_DELAY = 3000; // 3 seconds

export function LiveElections() {
    const { connection } = useAppKitConnection();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 5;

    const setupWebSocket = useCallback(() => {
        if (!connection) {
            setError('No connection available');
            return;
        }

        try {
            const wsEndpoint = connection.rpcEndpoint.replace('http', 'ws');
            const ws = new WebSocket(wsEndpoint);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                setError(null);
                setRetryCount(0);
                
                // Subscribe to program account changes
                ws.send(JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'programSubscribe',
                    params: [
                        // Your program ID here
                        'YOUR_PROGRAM_ID',
                        {
                            encoding: 'jsonParsed',
                            commitment: 'confirmed'
                        }
                    ]
                }));
            };

            ws.onclose = () => {
                console.log('WebSocket closed');
                setIsConnected(false);
                
                // Attempt to reconnect if under max retries
                if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        setupWebSocket();
                    }, RECONNECT_DELAY);
                } else {
                    setError('Max reconnection attempts reached');
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('WebSocket connection failed');
                setIsConnected(false);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.method === 'programNotification') {
                        // Handle program updates
                        console.log('Program update:', data.params);
                        // Update your UI state here
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            // Cleanup function
            return () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
        } catch (err) {
            console.error('Failed to setup WebSocket:', err);
            setError('Failed to setup WebSocket connection');
            return undefined;
        }
    }, [connection, retryCount]);

    useEffect(() => {
        const cleanup = setupWebSocket();
        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [setupWebSocket]);

    // Connection status indicator
    const connectionStatus = () => {
        if (error) {
            return (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                    Error: {error}
                </div>
            );
        }

        if (!isConnected) {
            return (
                <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
                    Connecting to election updates...
                </div>
            );
        }

        return (
            <div className="p-4 bg-green-100 text-green-700 rounded-md">
                Connected to election updates
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {connectionStatus()}
            
            {/* Your election updates UI here */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Live Elections</h2>
                {isConnected ? (
                    // Your elections list/grid here
                    <div>Election updates will appear here...</div>
                ) : (
                    <div className="text-gray-500">
                        Waiting for connection...
                    </div>
                )}
            </div>
        </div>
    );
}