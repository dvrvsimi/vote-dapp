/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vote.json`.
 */
export type Vote = {
  "address": "CbwSkuSw474aJCRBaJE3wvpwnkRRkCQbZc1NMrmrTXMS",
  "metadata": {
    "name": "vote",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "end",
      "discriminator": [
        180,
        160,
        249,
        217,
        194,
        121,
        70,
        16
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.authority",
                "account": "election"
              },
              {
                "kind": "account",
                "path": "election.id",
                "account": "election"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "electionId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "electionId",
          "type": "string"
        },
        {
          "name": "electionName",
          "type": "string"
        },
        {
          "name": "candidates",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "numWinners",
          "type": "u8"
        },
        {
          "name": "numPlusVotes",
          "type": "u8"
        },
        {
          "name": "numMinusVotes",
          "type": "u8"
        },
        {
          "name": "allowedVoterTypes",
          "type": {
            "vec": {
              "defined": {
                "name": "userType"
              }
            }
          }
        }
      ]
    },
    {
      "name": "registerVoter",
      "discriminator": [
        229,
        124,
        185,
        99,
        118,
        51,
        226,
        6
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "election",
          "writable": true
        },
        {
          "name": "userVerification",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "electionVoter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "updateVoterStatus",
      "discriminator": [
        231,
        138,
        163,
        168,
        81,
        216,
        139,
        92
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "election"
        },
        {
          "name": "electionVoter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "election_voter.voter",
                "account": "electionVoter"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newStatus",
          "type": {
            "defined": {
              "name": "voterStatus"
            }
          }
        }
      ]
    },
    {
      "name": "verifyUser",
      "discriminator": [
        127,
        54,
        157,
        106,
        85,
        167,
        116,
        119
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userVerification",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "idNumber",
          "type": "string"
        },
        {
          "name": "userType",
          "type": {
            "defined": {
              "name": "userType"
            }
          }
        }
      ]
    },
    {
      "name": "vote",
      "discriminator": [
        227,
        110,
        155,
        23,
        136,
        126,
        172,
        25
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.authority",
                "account": "election"
              },
              {
                "kind": "account",
                "path": "election.id",
                "account": "election"
              }
            ]
          }
        },
        {
          "name": "userVerification",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "electionVoter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "ballot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  108,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "plusVotes",
          "type": "bytes"
        },
        {
          "name": "minusVotes",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ballot",
      "discriminator": [
        3,
        232,
        121,
        204,
        232,
        137,
        138,
        164
      ]
    },
    {
      "name": "election",
      "discriminator": [
        68,
        191,
        164,
        85,
        35,
        105,
        152,
        202
      ]
    },
    {
      "name": "electionVoter",
      "discriminator": [
        156,
        42,
        169,
        232,
        244,
        51,
        177,
        98
      ]
    },
    {
      "name": "userVerification",
      "discriminator": [
        171,
        133,
        79,
        212,
        195,
        124,
        153,
        6
      ]
    }
  ],
  "events": [
    {
      "name": "electionVoterStatusChanged",
      "discriminator": [
        103,
        126,
        41,
        120,
        161,
        83,
        41,
        34
      ]
    },
    {
      "name": "userVerified",
      "discriminator": [
        191,
        18,
        15,
        86,
        86,
        109,
        153,
        63
      ]
    },
    {
      "name": "voterRegistered",
      "discriminator": [
        184,
        179,
        209,
        46,
        125,
        60,
        51,
        197
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "voterNotRegistered",
      "msg": "Voter is not registered"
    },
    {
      "code": 6001,
      "name": "voterAlreadyRegistered",
      "msg": "Voter is already registered"
    },
    {
      "code": 6002,
      "name": "voterNotEligible",
      "msg": "Voter is not eligible"
    },
    {
      "code": 6003,
      "name": "voterSuspended",
      "msg": "Voter is suspended"
    },
    {
      "code": 6004,
      "name": "invalidStatusTransition",
      "msg": "Invalid voter status transition"
    }
  ],
  "types": [
    {
      "name": "ballot",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "plusVotes",
            "type": "bytes"
          },
          {
            "name": "minusVotes",
            "type": "bytes"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "candidate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "plusVotes",
            "type": "i64"
          },
          {
            "name": "minusVotes",
            "type": "i64"
          },
          {
            "name": "rank",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "election",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "id",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "numWinners",
            "type": "u8"
          },
          {
            "name": "numPlusVotes",
            "type": "u8"
          },
          {
            "name": "numMinusVotes",
            "type": "u8"
          },
          {
            "name": "allowedVoterTypes",
            "type": {
              "vec": {
                "defined": {
                  "name": "userType"
                }
              }
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "electionStatus"
              }
            }
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "totalVoters",
            "type": "u32"
          },
          {
            "name": "candidates",
            "type": {
              "vec": {
                "defined": {
                  "name": "candidate"
                }
              }
            }
          },
          {
            "name": "winners",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "electionStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "created"
          },
          {
            "name": "active"
          },
          {
            "name": "ended"
          }
        ]
      }
    },
    {
      "name": "electionVoter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "registrationTime",
            "type": "i64"
          },
          {
            "name": "isEligible",
            "type": "bool"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "voterStatus"
              }
            }
          },
          {
            "name": "hasVoted",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "electionVoterStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "oldStatus",
            "type": {
              "defined": {
                "name": "voterStatus"
              }
            }
          },
          {
            "name": "newStatus",
            "type": {
              "defined": {
                "name": "voterStatus"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "student"
          },
          {
            "name": "staff"
          }
        ]
      }
    },
    {
      "name": "userVerification",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "idNumber",
            "type": "string"
          },
          {
            "name": "userType",
            "type": {
              "defined": {
                "name": "userType"
              }
            }
          },
          {
            "name": "isVerified",
            "type": "bool"
          },
          {
            "name": "verificationTime",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userVerified",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "idNumber",
            "type": "string"
          },
          {
            "name": "userType",
            "type": {
              "defined": {
                "name": "userType"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voterRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voterStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "suspended"
          },
          {
            "name": "revoked"
          },
          {
            "name": "onHold"
          }
        ]
      }
    }
  ]
};
