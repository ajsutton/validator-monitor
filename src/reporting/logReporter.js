
module.exports = {
    report(problem, block, problemObject) {
        console.log(JSON.stringify({
            problem, 
            validatorId: block.proposer_index, 
            slot: block.slot,
            problemObject
        }));
    }
}