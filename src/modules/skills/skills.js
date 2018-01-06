const fs = require('fs');
const jobsMapping = require('../jobsMapping/jobsMapping');
const Skill = require('../../classes/Skill');
const Job = require('../../classes/Job');

const pathToJobDesc = `${__dirname}/../../../data/jobsDesc/`;
const keywordsPath = `${__dirname}/../../../data/keywords.json`;

var getSkills = (jobTitle) => {
    let skills = {};
    let keywords = getKeyWordsList();
    let jobMapping = jobsMapping.getJobMapData(jobTitle);

    jobMapping[jobTitle].forEach((fileName) => {
        if (!fs.existsSync(pathToJobDesc + fileName)) return;

        let job = JSON.parse(fs.readFileSync(pathToJobDesc + fileName));
        let jobDesc = job.jtr_description;

        // let words = jobDesc.split(/[ .,/\n()!+]+/);
        // let words = jobDesc.match(/(\b\w*[-]\w*\b)|\w+/g);

        for (let [keyword, variations] of Object.entries(keywords)) {
            for (let keyphase of variations) {
                
                let keyphaseRegex = new RegExp(`\\b${keyphase}\\b`, 'i');

                if (keyphaseRegex.test(jobDesc)) {
                    // if dont have this keyword's object, create the new one
                    if (!skills[keyword]) {
                        skills[keyword] = new Skill(keyword);
                    }

                    skills[keyword].counting(new Job(job.jobtitle, job.url));

                    break;
                }
            }
        }
    });

    let result = generateJSONResult(jobMapping[jobTitle].length, skills);
    return JSON.stringify(result);
}

var getKeyWordsList = () => {
    try {
        return JSON.parse(fs.readFileSync(keywordsPath));
    }
    catch (err) {
        throw err;
    }
}

var generateJSONResult = (jobscount, skills) => {
    let result = {};
    result.jobscount = jobscount;
    result.skills = [];

    for (let skill in skills) {
        result.skills.push(skills[skill]);
    }

    return result;
}

module.exports = {
    getSkills
};

// console.log(getSkills('mobile developer'));
