const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

// Program Constants
const VOTING_PROGRAM_ID = 'CbwSkuSw474aJCRBaJE3wvpwnkRRkCQbZc1NMrmrTXMS';

// Instruction Discriminators
const INSTRUCTIONS = {
    INITIALIZE: [175, 175, 109, 31, 13, 152, 155, 237],
    VOTE: [227, 110, 155, 23, 136, 126, 172, 25],
    REGISTER_VOTER: [229, 124, 185, 99, 118, 51, 226, 6],
    VERIFY_USER: [127, 54, 157, 106, 85, 167, 116, 119],
    END: [180, 160, 249, 217, 194, 121, 70, 16]
};

// Event Discriminators
const EVENTS = {
    ELECTION_VOTER_STATUS_CHANGED: [103, 126, 41, 120, 161, 83, 41, 34],
    USER_VERIFIED: [191, 18, 15, 86, 86, 109, 153, 63],
    VOTER_REGISTERED: [184, 179, 209, 46, 125, 60, 51, 197]
};

// QuickNode Streams Filter Configuration
const FILTER_CONFIG = {
    programIds: [VOTING_PROGRAM_ID],
    skipFailed: true,
    instructionDiscriminators: [
        ...Object.values(INSTRUCTIONS),
        ...Object.values(EVENTS)
    ]
};

// Base58 decoding utilities
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase58(encoded) {
    if (typeof encoded !== 'string') return [];
    const result = [];
    
    for (let i = 0; i < encoded.length; i++) {
        let carry = BASE58_ALPHABET.indexOf(encoded[i]);
        if (carry < 0) return [];
        
        for (let j = 0; j < result.length; j++) {
            carry += result[j] * 58;
            result[j] = carry & 0xff;
            carry >>= 8;
        }
        
        while (carry > 0) {
            result.push(carry & 0xff);
            carry >>= 8;
        }
    }
    
    for (let i = 0; i < encoded.length && encoded[i] === '1'; i++) {
        result.push(0);
    }
    
    return result.reverse();
}

function matchesDiscriminator(encodedData, discriminator) {
    const decodedData = decodeBase58(encodedData);
    return discriminator.length === 8 && 
           discriminator.every((byte, index) => byte === decodedData[index]);
}

// Initialize Express and WebSocket server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients with their subscriptions
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.set(ws, new Set());

    ws.on('message', (message) => {
        try {
            const { type, channel } = JSON.parse(message);
            const subscriptions = clients.get(ws);
            
            if (type === 'subscribe') {
                subscriptions.add(channel);
                console.log(`Client subscribed to ${channel}`);
            } else if (type === 'unsubscribe') {
                subscriptions.delete(channel);
                console.log(`Client unsubscribed from ${channel}`);
            }
        } catch (error) {
            console.error('Error handling websocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString()
    }));
});

function broadcast(channel, data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            const subscriptions = clients.get(client);
            if (subscriptions && subscriptions.has(channel)) {
                client.send(JSON.stringify({
                    channel,
                    data,
                    timestamp: new Date().toISOString()
                }));
            }
        }
    });
}

app.use(bodyParser.json());

// Format transaction based on type
function formatTransaction(tx, type, instruction) {
    const baseFormat = {
        type,
        signature: tx.signature,
        blockTime: tx.blockTime,
        timestamp: new Date(tx.blockTime * 1000).toISOString(),
        slot: tx.slot
    };

    switch (type) {
        case 'new_election':
            return {
                ...baseFormat,
                authority: instruction.accounts[0],
                election: instruction.accounts[1]
            };
        case 'election_ended':
            return {
                ...baseFormat,
                authority: instruction.accounts[0],
                election: instruction.accounts[1]
            };
        case 'vote_cast':
            return {
                ...baseFormat,
                voter: instruction.accounts[0],
                election: instruction.accounts[1],
                ballot: instruction.accounts[4]
            };
        case 'voter_registered':
            return {
                ...baseFormat,
                voter: instruction.accounts[0],
                election: instruction.accounts[1],
                electionVoter: instruction.accounts[3]
            };
        case 'user_verified':
            return {
                ...baseFormat,
                user: instruction.accounts[0],
                userVerification: instruction.accounts[1]
            };
        default:
            return baseFormat;
    }
}

app.post('/webhook', (req, res) => {
    if (!req.body?.matchedTransactions) {
        return res.status(400).json({ error: 'Invalid webhook data' });
    }

    req.body.matchedTransactions.forEach(tx => {
        if (tx.instructions) {
            tx.instructions.forEach(ix => {
                // Handle Instructions
                if (matchesDiscriminator(ix.data, INSTRUCTIONS.INITIALIZE)) {
                    const formattedTx = formatTransaction(tx, 'new_election', ix);
                    console.log('\n🗳️ New Election Created:', formattedTx);
                    broadcast('elections', formattedTx);
                }
                else if (matchesDiscriminator(ix.data, INSTRUCTIONS.END)) {
                    const formattedTx = formatTransaction(tx, 'election_ended', ix);
                    console.log('\n🏁 Election Ended:', formattedTx);
                    broadcast('elections', formattedTx);
                }
                else if (matchesDiscriminator(ix.data, INSTRUCTIONS.VOTE)) {
                    const formattedTx = formatTransaction(tx, 'vote_cast', ix);
                    console.log('\n✅ Vote Cast:', formattedTx);
                    broadcast('votes', formattedTx);
                }
                else if (matchesDiscriminator(ix.data, INSTRUCTIONS.REGISTER_VOTER)) {
                    const formattedTx = formatTransaction(tx, 'voter_registered', ix);
                    console.log('\n📝 Voter Registered:', formattedTx);
                    broadcast('voters', formattedTx);
                }
                else if (matchesDiscriminator(ix.data, INSTRUCTIONS.VERIFY_USER)) {
                    const formattedTx = formatTransaction(tx, 'user_verified', ix);
                    console.log('\n✨ User Verified:', formattedTx);
                    broadcast('users', formattedTx);
                }

                // Handle Events (if present in logs)
                if (tx.meta?.logMessages) {
                    // Add event handling if needed
                    // This would require parsing the event data from logs
                }
            });
        }
    });

    res.status(200).json({ status: 'success' });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        connections: wss.clients.size,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log('\n📋 Filter Configuration:', JSON.stringify(FILTER_CONFIG, null, 2));
    console.log('\n👥 WebSocket channels available:');
    console.log('   - elections: Election creation and end');
    console.log('   - votes: Vote casts');
    console.log('   - voters: Voter registration and status changes');
    console.log('   - users: User verification');
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});