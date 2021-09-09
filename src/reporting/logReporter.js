
function hex2a(hex) {
    var str = '';
    for (var i = 2; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 16);
        if (v) {
            str += String.fromCharCode(v);
        }
    }
    return str;
}  

module.exports = {
    report(problem, block, problemObject) {
        console.log(JSON.stringify({
            problem, 
            validatorId: block.proposer_index, 
            slot: block.slot,
            graffiti: hex2a(block.body.graffiti),
            problemObject
        }));
    }
}