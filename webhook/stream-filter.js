const FILTER_CONFIG = {
  programId: "CbwSkuSw474aJCRBaJE3wvpwnkRRkCQbZc1NMrmrTXMS",
  skipFailed: false,
};

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Instruction discriminators from your IDL
const INSTRUCTION_DISCRIMINATORS = {
  INITIALIZE: [175, 175, 109, 31, 13, 152, 155, 237],
  VOTE: [227, 110, 155, 23, 136, 126, 172, 25],
  REGISTER_VOTER: [229, 124, 185, 99, 118, 51, 226, 6],
  VERIFY_USER: [127, 54, 157, 106, 85, 167, 116, 119],
  UPDATE_VOTER_STATUS: [231, 138, 163, 168, 81, 216, 139, 92],
  END: [180, 160, 249, 217, 194, 121, 70, 16]
};

// Enums from the IDL
const USER_TYPES = {
  STUDENT: 0,
  STAFF: 1
};

const VOTER_STATUSES = {
  PENDING: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
  REVOKED: 3,
  ON_HOLD: 4
};

const ELECTION_STATUSES = {
  CREATED: 0,
  ACTIVE: 1,
  ENDED: 2
};

function decodeBase58(encoded) {
  if (typeof encoded !== "string") return [];
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
  for (let i = 0; i < encoded.length && encoded[i] === "1"; i++) {
    result.push(0);
  }
  return result.reverse();
}

function parseDecodedData(decodedData) {
  try {
    let position = 0;

    // Get instruction type from discriminator
    const discriminator = decodedData.slice(0, 8);
    position += 8;

    // Helper functions
    const readU32 = () => {
      const value =
        decodedData[position] +
        (decodedData[position + 1] << 8) +
        (decodedData[position + 2] << 16) +
        (decodedData[position + 3] << 24);
      position += 4;
      return value;
    };

    const readString = () => {
      const length = readU32();
      const bytes = decodedData.slice(position, position + length);
      position += length;
      return bytes.reduce((str, byte) => str + String.fromCharCode(byte), "");
    };

    const readPubkey = () => {
      const pubkeyBytes = decodedData.slice(position, position + 32);
      position += 32;
      return pubkeyBytes;
    };

    const readUserType = () => {
      const userTypeIndex = decodedData[position];
      position += 1;
      return Object.keys(USER_TYPES).find(key => USER_TYPES[key] === userTypeIndex);
    };

    // Match discriminators for each instruction type
    if (discriminator.every((byte, i) => byte === INSTRUCTION_DISCRIMINATORS.INITIALIZE[i])) {
      return {
        type: "INITIALIZE",
        data: {
          electionId: readString(),
          electionName: readString(),
          candidates: Array.from({ length: readU32() }, () => readPubkey()),
          numWinners: decodedData[position++],
          numPlusVotes: decodedData[position++],
          numMinusVotes: decodedData[position++],
          allowedVoterTypes: Array.from({ length: readU32() }, () => readUserType())
        }
      };
    }

    if (discriminator.every((byte, i) => byte === INSTRUCTION_DISCRIMINATORS.VOTE[i])) {
      return {
        type: "VOTE",
        data: {
          plusVotes: decodedData.slice(position, position + readU32()),
          minusVotes: decodedData.slice(position, position + readU32())
        }
      };
    }

    if (discriminator.every((byte, i) => byte === INSTRUCTION_DISCRIMINATORS.VERIFY_USER[i])) {
      return {
        type: "VERIFY_USER",
        data: {
          idNumber: readString(),
          userType: readUserType()
        }
      };
    }

    if (discriminator.every((byte, i) => byte === INSTRUCTION_DISCRIMINATORS.REGISTER_VOTER[i])) {
      return {
        type: "REGISTER_VOTER",
        data: {} // No arguments
      };
    }

    if (discriminator.every((byte, i) => byte === INSTRUCTION_DISCRIMINATORS.UPDATE_VOTER_STATUS[i])) {
      return {
        type: "UPDATE_VOTER_STATUS",
        data: {
          newStatus: Object.keys(VOTER_STATUSES).find(
            key => VOTER_STATUSES[key] === decodedData[position]
          )
        }
      };
    }

    if (discriminator.every((byte, i) => byte === INSTRUCTION_DISCRIMINATORS.END[i])) {
      return {
        type: "END",
        data: {} // No arguments
      };
    }

    return {
      type: "UNKNOWN",
      discriminator: discriminator,
    };
  } catch (error) {
    return {
      error: error.message,
      raw: decodedData,
    };
  }
}

function main(block) {
    try {
        // Log the input to see what we're getting
        console.log("Input block:", JSON.stringify(block));
        
        // Safety checks
        if (!block) {
            console.log("No block data");
            return null;
        }

        // Try different possible block formats
        const transactions = Array.isArray(block) ? block[0] : 
                           block.data ? block.data : 
                           block.transactions ? block.transactions :
                           block;

        if (!transactions) {
            console.log("No transactions found");
            return null;
        }

        console.log("Found transactions:", JSON.stringify(transactions));

        // Process only if we have transactions
        if (Array.isArray(transactions)) {
            const matches = transactions.filter(tx => 
                tx?.programInvocations?.some(pi => 
                    pi?.programId === FILTER_CONFIG.programId
                )
            );

            console.log("Matched transactions:", JSON.stringify(matches));

            if (matches.length === 0) return null;

            return {
                matchedTransactions: matches.map(tx => ({
                    signature: tx.signature,
                    slot: tx.slot,
                    blockTime: tx.blockTime,
                    programInvocations: tx.programInvocations.filter(pi => 
                        pi.programId === FILTER_CONFIG.programId
                    ),
                    logs: tx.logs
                }))
            };
        }

        return null;
    } catch (error) {
        console.error("Error in filter:", error);
        return { error: error.message };
    }
}