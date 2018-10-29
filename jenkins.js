const fs = require('fs');
const path = require('path');
const unirest = require('unirest');

function getUrlByBranch(branch) {
    const host = 'jenkins.dud4.co';
    if (branch === 'trunk' || branch === 'freeze') {
        return `https://${host}/jenkins/job/${branch}/api/json`;
    } else {
        return `https://${host}/jenkins/job/branches/job/${branch}/api/json`;
    }
}

function getBranchStatus(branch, callback) {
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    const url = getUrlByBranch(branch);
    const credentialPath = path.join(__dirname, 'credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialPath, 'utf-8'));
    unirest.get(url).headers(headers).auth(credentials)
        .send()
        .end(callback);
}

module.exports = {
    getBranchStatus
}