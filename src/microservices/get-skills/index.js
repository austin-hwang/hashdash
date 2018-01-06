var http = require('http');
var pathmod = require('path');
var gcs, bucket, express, app;
try {
    gcs = require('@google-cloud/storage')();
    bucket = gcs.bucket('hatchdashscrapedata');
} catch (err) {
    console.log("gcs not found.");
    initLocalWebService();
}
const fs = require('fs');
var path;
if (bucket) {
    path = 'jobdescription/';
}
else {
    path = 'jobsDesc/';
}

function initLocalWebService(){
    express = require('express');
    app = express();
    app.set('port', process.env.PORT || 1234);

    http.createServer(app).listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });

    app.get('/get-skills', function (req, res) {
        exports.getSkills(req, res);
    });
}

var getKeyWordsList = () => {
    return new Promise((resolve, reject) => {
        let streamData = '';

        if (bucket) {
            let readStream = bucket.file('keywords.json').createReadStream()
                .on('error', function (err) { reject(err); })
                .on('data', function (chunk) {
                    streamData += chunk;
                })
                .on('end', function () {
                    keywordsList = JSON.parse(streamData);

                    resolve(keywordsList);
                });
        }
        else {
            fs.readFile(__dirname + '/../../../data/keywords.json', 'utf-8', function (err, data) {
                if (err) throw err;
                keywordsList = JSON.parse(data);
                resolve(keywordsList);
            });

        }
    });

}

var getIndeedSkills = (jobTitle) => {
    return new Promise((resolve, reject) => {
        getKeyWordsList().then((keywords) => {
            getJobMapData(jobTitle).then((jobMapping) => {

                var promises = [];

                // jobMapping[jobTitle].forEach((fileName) => {
                for (let fileName of jobMapping[jobTitle]) {

                    if (bucket) {
                        let file = bucket.file(path + fileName);
                        promises.push(getJobData(file));
                    }
                    else {
                        //console.log(pathmod.join(__dirname, "../../../data/", path + fileName));
                        let filePath = pathmod.join(__dirname, "../../../data/", path + fileName);
                        promises.push(getJobData(filePath));

                    }

                    // let existData = await file.exists();
                    // let isExist = existData[0];
                    // if (!isExist) return;


                };

                Promise.all(promises).then((jobs) => {
                    let skills = {};

                    for (job of jobs) {
                        let jobDesc = job.jtr_description;

                        //for (let [keyword, variations] of Object.entries(keywords)) {
                        for (keyword in keywords) {
                            variations = keywords[keyword];
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
                    }

                    let result = generateJSONResult(jobMapping[jobTitle].length, skills);
                    resolve(JSON.stringify(result));
                })
                    .catch((err) => {
                        console.error(err);
                    })
            });
        });
    });
};

exports.getSkills = function (req, res) { //remove exports and change to var to use locally
    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    let jobTitle = req.query.jobTitle;

    if (jobTitle) {
        getIndeedSkills(jobTitle).then(result => {
            res.status(200).send(result);
        });
    } else {
        res.status(200).send('Need "jobTitle" param');
    }
};

/*if (!bucket) {
    getSkills({
        query: {
            jobTitle: 'mobile developer'
        }
    }, {
            status: function () {
                return {
                    send: function (message) {
                        console.log(message);
                    }
                }
            }, header: function () {

            }, setHeader: function () {

            }
        })
}*/

var generateJSONResult = (jobscount, skills) => {
    let result = {};
    result.jobscount = jobscount;
    result.skills = [];

    for (let skill in skills) {
        result.skills.push(skills[skill]);
    }

    return result;
}

var getJobMapData = (jobTitle) => {
    let jobMapping = {};
    let streamData = '';

    return new Promise((resolve, reject) => {
        if (bucket) {
            let readStream = bucket.file('jobsMap.json').createReadStream()
                .on('error', function (err) { reject(err); })
                .on('data', function (chunk) {
                    streamData += chunk;
                })
                .on('end', function () {
                    jobMapping = JSON.parse(streamData);

                    if (!jobMapping[jobTitle]) {
                        jobMapping[jobTitle] = [];
                    }

                    resolve(jobMapping);
                });
        }
        else {
            fs.readFile(__dirname + '/../../../data/jobsMap.json', 'utf-8', function (err, data) {
                if (err) throw err;
                jobMapping = JSON.parse(data);

                if (!jobMapping[jobTitle]) {
                    jobMapping[jobTitle] = [];
                }

                resolve(jobMapping);

            });
        }
    });
};

var getJobData = (file) => {
    return new Promise((resolve, reject) => {
        let streamData = '';

        if (bucket) {
            file.createReadStream()
                .on('error', function (err) { reject(err); })
                .on('data', function (chunk) {
                    streamData += chunk;
                })
                .on('end', function () {
                    jobData = JSON.parse(streamData);

                    resolve(jobData);
                });
        }
        else {

            fs.readFile(file, 'utf-8', function (err, data) {
                if (err) throw err;
                jobData = JSON.parse(data);
                resolve(jobData);
            });
        }
    });
}

class Skill {
    /**
     * Constructor of Skill object
     * 
     * @param {String} name - Skill name, such as aws, html5, and so on
     */
    constructor(name) {
        this.name = name;
        this.count = 0;
        this.score = 0;
        this.jobs = [];
    }

    /**
     * Counting the skill if it is found in a job description, and put the found job into jobs array
     * 
     * @param {object} job - "Job" object which contains data from a job description.
     */
    counting(job) {
        this.count++;
        this.score++;

        this.jobs.push(job);
    }
}

class Job {
    /**
     * Constructor of Job object
     * 
     * @param {String} title - Job title
     * @param {String} url - Job source in URL format
     */
    constructor(title, url) {
        this.title = title;
        this.url = url;
    }
}

