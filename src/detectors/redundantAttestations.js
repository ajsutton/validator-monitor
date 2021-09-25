const got = require('got');
const BitSet = require('bitset');

const SLOTS_PER_EPOCH = 32;
const MAX_INCLUSION_DISTANCE = SLOTS_PER_EPOCH;
const MAX_SOURCE_DISTANCE = 5;

// When each head event is retrieved, make sure we have the last 32 blocks processed here
// For each block record attestation data hash to bitset of validators seen in that block
// On new block, check each attestation includes some validator that does not have a bitset or flag as redundant
// Then add block record to this list.
// Blocks are inserted as blockNumber % 32 so the array automatically overwrites itself to prune.
const recentInclusions = [];
const targets = {};
var latestBlockNumber = 0;
var reporter;
var node;

// TODO: Identify reorgs by checking root of parent block?
// TODO: Record where attestations were seen (block + attestation index)
// TODO: Use separate class for reporting problems

function recordAttestations(slot, proposerIndex, attestations) {
    const inclusions = {}
    attestations.forEach(attestation => {
        const key = getKey(attestation);
        const seen = inclusions[key] || new BitSet();
        const aggregationBits = BitSet.fromHexString(attestation.aggregation_bits);
        inclusions[key] = (inclusions[key] || new BitSet()).or(aggregationBits);
    });
    recentInclusions[slot % MAX_INCLUSION_DISTANCE] = inclusions;
}

async function checkAttestations(slot, block, attestations) {
    // Sort attestations by attestation data
    const attestationsByData = {};
    for (var i = 0; i < attestations.length; i++) {
        const attestation = attestations[i];
        if (Number(attestation.data.slot) + 5 < slot) {
            // Attestations with incorrect target checkpoint are automatically redundant if they are more than 5 slots old
            const correctTargetRoot = await getCorrectTargetRoot(attestation.data.slot);
            if (attestation.data.target.root != correctTargetRoot) {
                reporter.report('Worthless Attestation', block, attestation);
                continue;
            }
        }
        const key = getKey(attestation);
        if (attestationsByData.hasOwnProperty(key)) {
            attestationsByData[key].push(attestation);
        } else {
            attestationsByData[key] = [ attestation ];
        }
    }

    Object.entries(attestationsByData).forEach(([key, matchingAttestations]) => checkMatchingAttestations(slot, block, key ,matchingAttestations));
}

function checkMatchingAttestations(slot, block, key, attestations) {
    const previouslySeenBits = recentInclusions.map(block => (block && block[key]) || new BitSet()).reduce((a, b) => a.or(b));
    attestations.forEach(attestation => {
        const otherInclusions = attestations.filter(a => a != attestation).map(a => a.aggregation_bits).reduce((a, b) => a.or(b), new BitSet());
        if (otherInclusions.equals(otherInclusions.or(attestation.aggregation_bits))) {
            reporter.report('Redundant Attestation', block, attestation);
        }
    });
}

async function processToBlock(node, headSlot) {
    const earlySlot = headSlot - MAX_INCLUSION_DISTANCE - 1;
    const startBlock = Math.max(latestBlockNumber, earlySlot) + 1;
    for (var slot = startBlock; slot <= headSlot; slot++) {
        recentInclusions[slot % MAX_INCLUSION_DISTANCE] = {};
        try {
            const blockResponse = await node.api.getBlock(slot);
            const attestations = blockResponse.data.message.body.attestations;
            if (attestations.length > 0) {
                await checkAttestations(slot, blockResponse.data.message, attestations)
                recordAttestations(slot, blockResponse.data.message, attestations);
            }
        } catch (err) {
            recentInclusions[slot % MAX_INCLUSION_DISTANCE] = {};
        }
        latestBlockNumber = slot;
    }
}

function getKey(attestation) {
    return JSON.stringify(attestation.data);
}

async function handleReorg(node, commonAncestorSlot, bestSlot) {
    console.log("Reorg detected from %s to %s", commonAncestorSlot, bestSlot);
}

async function getCorrectTargetRoot(attestationSlot) {
    const originalTargetSlot = getTargetCheckpointSlot(attestationSlot);
    var targetSlot = originalTargetSlot;
    while (targetSlot >= 0) {
        if (targets.hasOwnProperty(targetSlot)) {
            return targets[targetSlot];
        }
        try {
            const correctRoot = await node.api.getBlockRoot(targetSlot);
            for (var slot = targetSlot; slot <= originalTargetSlot; slot++) {
                targets[slot] = correctRoot;
            }
            return correctRoot;
        } catch (error) {
            targetSlot--;
        }
    }
}

function getTargetCheckpointSlot(attestationSlot) {
    return Math.floor(attestationSlot / SLOTS_PER_EPOCH) * SLOTS_PER_EPOCH;
}

module.exports = {
    async processToSlot(slot) {
        await processToBlock(node, slot); 
    },
    async start(_node, _reporter) {
        reporter = _reporter;
        node = _node;
        // node.events.subscribe('head', async headEvent => {
        //     try {
        //         await processToBlock(node, JSON.parse(headEvent).slot)
        //     } catch (error) {
        //         console.error("Failed to process head event", error);
        //     }
        // });
        // node.events.subscribe('reorg', reorgEvent => handleReorg(node, reorgEvent.commonAncestorSlot, reorgEvent.bestSlot))
    },
    async poll() {
        
    },
};