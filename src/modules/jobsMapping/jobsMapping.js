const fs = require('fs');

const jobMappingFilePath = `${__dirname}/../../../data/jobsMap.json`;

var getJobMapData = (jobTitle) => {
    let jobMapping = {};

    // get exist data
    if (fs.existsSync(jobMappingFilePath)) {
        jobMapping = JSON.parse(fs.readFileSync(jobMappingFilePath));
    }

    // check if the key isn't exist, create new array
    if (!jobMapping[jobTitle]) {
        jobMapping[jobTitle] = [];
    }

    return jobMapping;
};

var writeJobMapData = (jobMapping) => {
    fs.writeFileSync(jobMappingFilePath, JSON.stringify(jobMapping));
};

var pushIfNotExist = (jobMapping, jobTitle, fileName) => {
    if (jobMapping[jobTitle].indexOf(fileName) === -1) {
        jobMapping[jobTitle].push(fileName);
    }
};

var getJobTitles = () => {
    let jobs = [];

    if (fs.existsSync(jobMappingFilePath)) {
        let jobMapping = JSON.parse(fs.readFileSync(jobMappingFilePath));

        for (job in jobMapping) {
            jobs.push(job);
        }
    } else {
        console.log('no such a file');
    }

    return jobs;
};

module.exports = {
    getJobMapData,
    writeJobMapData,
    pushIfNotExist,
    getJobTitles
};