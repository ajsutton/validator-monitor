
module.exports = {
    report(problem, block, moreInfo) {
        console.log({
            problem, 
            validatorId: block.proposer_index, 
            slot: block.slot
        });
    }
}