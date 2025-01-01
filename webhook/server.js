const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const crypto = require('crypto');

// Program Constants
const VOTING_PROGRAM_ID = 'CbwSkuSw474aJCRBaJE3wvpwnkRRkCQbZc1NMrmrTXMS';

// Instruction Discriminators from your IDL
const INSTRUCTIONS = {
    INITIALIZE: [175, 175, 109, 31, 13, 152, 155, 237],
    VOTE: [227, 110, 155, 23, 136, 126, 172, 25],
    REGISTER_VOTER: [229, 124, 185, 99, 118, 51, 226, 6],
    VERIFY_USER: [127, 54, 157, 106, 85, 167, 116, 119],
    UPDATE_VOTER_STATUS: [231, 138, 163, 168, 81, 216, 139, 92],
    END: [180, 160, 249, 217, 194, 121, 70, 16]
};

// Enhanced Logging Middleware
function loggerMiddleware(req, res, next) {
    const requestId = crypto.randomBytes(8).toString('hex');
    req.requestId = requestId;
    
    const startTime = Date.now();
    console.log(`[${requestId}] ${req.method} ${req.path} - Started`);

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ${req.method} ${req.path} - Completed (${res.statusCode}) - ${duration}ms`);
    });

    next();
}

// Initialize Express and WebSocket server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Enhanced WebSocket Management
class WebSocketManager {
    constructor() {
        this.clients = new Map();
        this.channels = {
            elections: new Set(),
            votes: new Set(),
            voters: new Set(),
            users: new Set(),
            unknown: new Set()
        };
    }

    broadcast(channel, data) {
        this.channels[channel].forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    channel,
                    data,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    }

    subscribe(ws, channel) {
        if (this.channels[channel]) {
            this.channels[channel].add(ws);
            console.log(`Client subscribed to ${channel}`);
        }
    }

    unsubscribe(ws, channel) {
        if (this.channels[channel]) {
            this.channels[channel].delete(ws);
            console.log(`Client unsubscribed from ${channel}`);
        }
    }
}

const wsManager = new WebSocketManager();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', (message) => {
        try {
            const { type, channel } = JSON.parse(message);
            
            if (type === 'subscribe') {
                wsManager.subscribe(ws, channel);
            } else if (type === 'unsubscribe') {
                wsManager.unsubscribe(ws, channel);
            }
        } catch (error) {
            console.error('Error handling websocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove client from all channels
        Object.values(wsManager.channels).forEach(channelSet => {
            channelSet.delete(ws);
        });
    });

    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString()
    }));
});

// Middleware
app.use(loggerMiddleware);
app.use(bodyParser.json());

// Webhook endpoint with advanced parsing
app.post('/webhook', (req, res) => {
    try {
        console.log('\n📥 Received webhook data:', JSON.stringify(req.body, null, 2));

        // Log instruction discriminators for reference
        console.log('Supported Instruction Discriminators:', INSTRUCTIONS);


        // Verify the program ID matches
        const matchingTransactions = req.body?.matchedTransactions?.filter(
            tx => tx.programId === VOTING_PROGRAM_ID
        );

        if (!matchingTransactions || matchingTransactions.length === 0) {
            console.log('❌ No transactions for the voting program');
            return res.status(200).json({ status: 'success' });
        }

        matchingTransactions.forEach(tx => {
            const parsedData = tx.parsedData?.data;
            
            switch(tx.parsedData?.type) {
                case 'INITIALIZE':
                    const electionEvent = {
                        type: 'election_initialized',
                        electionId: parsedData.electionId,
                        electionName: parsedData.electionName,
                        candidates: parsedData.candidates.map(candidate => 
                            Buffer.from(candidate).toString('hex')
                        ),
                        numWinners: parsedData.numWinners,
                        numPlusVotes: parsedData.numPlusVotes,
                        numMinusVotes: parsedData.numMinusVotes,
                        allowedVoterTypes: parsedData.allowedVoterTypes,
                        signature: tx.signature,
                        blockTime: tx.blockTime,
                        timestamp: new Date(tx.blockTime * 1000).toISOString()
                    };
                    
                    console.log('🗳️ Election Initialized:', electionEvent);
                    wsManager.broadcast('elections', electionEvent);
                    break;

                case 'VOTE':
                    const voteEvent = {
                        type: 'vote_cast',
                        plusVotes: Buffer.from(parsedData.plusVotes).toString('hex'),
                        minusVotes: Buffer.from(parsedData.minusVotes).toString('hex'),
                        signature: tx.signature,
                        blockTime: tx.blockTime,
                        timestamp: new Date(tx.blockTime * 1000).toISOString()
                    };
                    
                    console.log('✅ Vote Cast:', voteEvent);
                    wsManager.broadcast('votes', voteEvent);
                    break;

                case 'REGISTER_VOTER':
                    const voterRegistrationEvent = {
                        type: 'voter_registered',
                        voter: tx.accounts[0],
                        election: tx.accounts[1],
                        signature: tx.signature,
                        blockTime: tx.blockTime,
                        timestamp: new Date(tx.blockTime * 1000).toISOString()
                    };
                    
                    console.log('👤 Voter Registered:', voterRegistrationEvent);
                    wsManager.broadcast('voters', voterRegistrationEvent);
                    break;

                case 'VERIFY_USER':
                    const userVerificationEvent = {
                        type: 'user_verified',
                        idNumber: parsedData.idNumber,
                        userType: parsedData.userType,
                        user: tx.accounts[0],
                        signature: tx.signature,
                        blockTime: tx.blockTime,
                        timestamp: new Date(tx.blockTime * 1000).toISOString()
                    };
                    
                    console.log('🔍 User Verified:', userVerificationEvent);
                    wsManager.broadcast('users', userVerificationEvent);
                    break;

                case 'UPDATE_VOTER_STATUS':
                    const voterStatusUpdateEvent = {
                        type: 'voter_status_updated',
                        newStatus: parsedData.newStatus,
                        voter: tx.accounts[0],
                        election: tx.accounts[1],
                        signature: tx.signature,
                        blockTime: tx.blockTime,
                        timestamp: new Date(tx.blockTime * 1000).toISOString()
                    };
                    
                    console.log('🔄 Voter Status Updated:', voterStatusUpdateEvent);
                    wsManager.broadcast('voters', voterStatusUpdateEvent);
                    break;

                case 'END':
                    const electionEndEvent = {
                        type: 'election_ended',
                        authority: tx.accounts[0],
                        election: tx.accounts[1],
                        signature: tx.signature,
                        blockTime: tx.blockTime,
                        timestamp: new Date(tx.blockTime * 1000).toISOString()
                    };
                    
                    console.log('🏁 Election Ended:', electionEndEvent);
                    wsManager.broadcast('elections', electionEndEvent);
                    break;

                default:
                    console.log('❓ Unknown Instruction Type:', tx.parsedData?.type);
                    wsManager.broadcast('unknown', {
                        type: 'unknown_instruction',
                        rawData: tx,
                        timestamp: new Date().toISOString()
                    });
            }
        });

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(200).json({ status: 'success' });
    }
});

// Comprehensive health check endpoint
app.get('/health', (req, res) => {
    const channelStats = Object.fromEntries(
        Object.entries(wsManager.channels).map(
            ([channel, clients]) => [channel, clients.size]
        )
    );

    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        websocket: {
            totalConnections: wss.clients.size,
            channelSubscriptions: channelStats
        },
        system: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        }
    });
});

// Metrics endpoint for advanced monitoring
app.get('/metrics', (req, res) => {
    res.status(200).json({
        websocket: {
            totalConnections: wss.clients.size,
            channelSubscriptions: Object.fromEntries(
                Object.entries(wsManager.channels).map(
                    ([channel, clients]) => [channel, clients.size]
                )
            )
        },
        system: {
            cpuUsage: process.cpuUsage(),
            memoryUsage: process.memoryUsage()
        },
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log('\n👥 WebSocket channels available:');
    console.log('   - elections: Election creation and status');
    console.log('   - votes: Vote casting events');
    console.log('   - voters: Voter registration');
    console.log('   - users: User verification');
});

// Enhanced Error Handling
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    // Optionally, send alert to monitoring system
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection:', reason);
    // Optionally, send alert to monitoring system
});

module.exports = { app, server, wss };