var gcs, bucket;

// gcs = require('@google-cloud/storage')();
/*gcs = require('@google-cloud/storage')({
    projectId: 'hatchdash',
    keyFilename: './hatchdash-ea2034d649fb.json'
});

bucket = gcs.bucket('hatchdashscrapedata');*/

try {
    gcs = require('@google-cloud/storage')();

    bucket = gcs.bucket('hatchdashscrapedata');
}
catch (err) {
    console.log('gcs not found.');
}

const schedule = require('node-schedule');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const jtr_source = 'indeed'

let task;

var getJobTitles = (callback) => {
    let jobs = [];
    let streamData = '';
    let jobMapping;

    if (bucket) {
        let readStream = bucket.file('jobsMap.json').createReadStream()
            .on('error', function (err) {
                console.log(err);
            })
            .on('data', function (chunk) {
                streamData += chunk;
            })
            .on('end', function () {
                jobMapping = JSON.parse(streamData);

                for (job in jobMapping) {
                    jobs.push(job);
                }

                callback(undefined, jobs);
            });
    } else {
        fs.readFile('data/jobsMap.json', 'utf-8', function (err, data) {
            if (err) console.log(err);
            console.log(data);
            jobMapping = JSON.parse(data);

            for (job in jobMapping) {
                jobs.push(job);
            }

            callback(undefined, jobs);
        });
    }
};

exports.scrapeIndeed = function (req, res) { //remove exports and change to var to use locally
    // let min = req.query.min || '0';
    // let hour = req.query.hour || '0';
    // let dom = req.query.dom || '*';
    // let month = req.query.month || '*';
    // let dow = req.query.dow || '*';

    if (req.query.start === '0') {
        if (task) {
            // task.cancel();
            clearInterval(task);
        }

        res.status(200).send('Stop the task');
    } else if (req.query.start === '1') {
        // task = schedule.scheduleJob(`${min} ${hour} ${dom} ${month} ${dow}`, () => {
        //     getJobTitles((err, jobs) => {
        //         var scrapedJobs = [];

        //         console.log('jobs:', jobs);

        //         loopJobs(jobs, scrapedJobs);
        //     });
        // });

        var dayInMilliseconds = 1000 * 60 * 60 * 24;
        task = setInterval(function () {
            getJobTitles((err, jobs) => {
                var scrapedJobs = [];

                console.log('jobs:', jobs);

                loopJobs(jobs, scrapedJobs);
            });
        }, dayInMilliseconds);

        //res.status(200).send(`Start task with ${min} ${hour} ${dom} ${month} ${dow}`);
        res.status(200).send('Start daily task');
    } else if (req.query.start === 'now') {
        getJobTitles((err, jobs) => {
            var scrapedJobs = [];
            console.log('jobs:', jobs);

            loopJobs(jobs, scrapedJobs);
        });

        res.status(200).send('Start the task once');
    } else {
        res.status(200).send('Need "start" param with proper value');
    }
};

if (!bucket) {
    exports.scrapeIndeed({
        query: {
            start: 'now'
        }
    }, {
            status: function () {
                return {
                    send: function (message) {
                        console.log(message);
                    }
                }
            }
        })
}

var scrape = (q, callback) => {
    var allJobs = [];
    var count = 0;

    for (var i = 0; i < 5; i++) {
        getJobs({
            query: q, start: i * 25
        }, (error, jobTitle, jobs) => {
            count++;
            if (error) {
                console.log(error);
                callback(error);
            } else {
                allJobs.push.apply(allJobs, jobs);
                //console.log('This is the total array', allJobs);
                if (count == 4) {
                    scrapeJobs(jobTitle, allJobs, (error, files) => {
                        if (error) {
                            console.log(error);
                            callback(error);
                        } else {
                            callback(undefined);
                        }
                    });
                }
            }
        });
    }
};


var getJobMapData = (jobTitle, callback) => {
    let jobMapping = {};
    let streamData = '';

    if (bucket) {
        let readStream = bucket.file('jobsMap.json').createReadStream()
            .on('error', function (err) { })
            .on('data', function (chunk) {
                streamData += chunk;
            })
            .on('end', function () {
                jobMapping = JSON.parse(streamData);

                if (!jobMapping[jobTitle]) {
                    jobMapping[jobTitle] = [];
                }

                callback(undefined, jobMapping);
            });
    } else {
        fs.readFile('data/jobsMap.json', 'utf-8', function (err, data) {
            if (err) throw err;
            console.log(data);
            jobMapping = JSON.parse(data);

            if (!jobMapping[jobTitle]) {
                jobMapping[jobTitle] = [];
            }

            callback(undefined, jobMapping);
        });
    }
};

var writeJobMapData = (jobMapping, callback) => {
    if (bucket) {
        var writeStream = bucket.file('jobsMap.json').createWriteStream({
            validation: false
        });
        writeStream.write(JSON.stringify(jobMapping));
        writeStream.end();
        writeStream.on('finish', () => {
            callback(undefined);
        });
    } else {
        fs.writeFile('data/jobsMap.json', JSON.stringify(jobMapping), function (err) {
            if (err) throw err;
            callback(undefined);
        });
    }
};

var pushIfNotExist = (jobMapping, jobTitle, fileName) => {
    if (jobMapping[jobTitle].indexOf(fileName) === -1) {
        jobMapping[jobTitle].push(fileName);
    }
};

var getJobs = (q, callback) => {
    let query = q.query || '';
    let location = q.location || 'San Francisco Bay Area, CA';
    let userip = q.userip || '1.2.3.4';
    let useragent = q.useragent || 'Mozilla//4.0(Firefox)';
    let start = q.start || 0;
    //let limit = q.limit || 25;

    let uri = `http://api.indeed.com/ads/apisearch?publisher=4477264408672364&format=json&q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=&radius=50&st=jobsite&jt=&start=${start}&limit=125&fromage=&filter=&latlong=1&co=us&chnl=&userip=${userip}&useragent=${encodeURIComponent(useragent)}&v=2`;

    console.log('The url is ', uri);

    request({
        url: uri,
        json: true
    }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            callback(undefined, query, body.results);
        } else {
            callback('Unable to connect to api.indeed.com');
        }
    });
};

var scrapeJobs = (jobTitle, jobs, callback) => {
    let files = [];

    getJobMapData(jobTitle, (err, jobMapping) => {
        loopScraping(jobs, files, jobTitle, jobMapping, callback);
    });
};

var loopScraping = (jobs, files, jobTitle, jobMapping, callback) => {
    let job = jobs[files.length];

    let fileName = `indeed_${job.jobkey}`;

    if (bucket) {
        var file = `/jobdescription/${fileName}`;
    }
    else {
        var file = `data/jobsDesc/${fileName}`;
    }

    pushIfNotExist(jobMapping, jobTitle, fileName);

    job.url = job.url.substring(0, job.url.indexOf('&qd='));

    console.log('--------------------');
    console.log('job.url', job.url);

    request(job.url, (error, response, html) => {
        if (error) {
            console.log(error);
        } else {
            var $ = cheerio.load(html);

            $('#job_summary').filter(function () {
                job.jtr_description = $(this).text();

                job.jtr_source = jtr_source;

                if (bucket) {
                    var writeStream = bucket.file(file).createWriteStream({
                        validation: false,
                        resumable: false
                    });
                    writeStream.write(JSON.stringify(job));
                    writeStream.end();
                    writeStream.on('error', function (err) {
                        console.log(err);
                    });
                    writeStream.on('finish', () => {
                        console.log(`finish writing ${fileName} for ${jobTitle}`);

                        files.push(file);

                        if (files.length < jobs.length) {
                            console.log(`${files.length} | ${jobs.length}`);

                            loopScraping(jobs, files, jobTitle, jobMapping, callback);
                        } else {
                            writeJobMapData(jobMapping, (err) => {
                                callback(undefined, files);
                            });
                        }
                    });
                } else {
                    fs.writeFile(file, JSON.stringify(job), function (err) {
                        if (err) throw (err);
                        console.log(`finish writing ${fileName} for ${jobTitle}`);

                        files.push(file);

                        if (files.length < jobs.length) {
                            console.log(`${files.length} | ${jobs.length}`);

                            loopScraping(jobs, files, jobTitle, jobMapping, callback);
                        } else {
                            writeJobMapData(jobMapping, (err) => {
                                callback(undefined, files);
                            });
                        }
                    });

                }
            });
        }
    });
};

var loopJobs = (jobs, scrapedJobs) => {
    console.log('--------------------');
    console.log('job:', jobs[scrapedJobs.length]);

    scrape(jobs[scrapedJobs.length], (err) => {
        if (err) {
            console.log(err);
        } else {
            scrapedJobs.push(jobs[scrapedJobs.length]);

            if (scrapedJobs.length < jobs.length) {
                loopJobs(jobs, scrapedJobs);
            } else {
                console.log('--------------------');
                console.log('finish daily task');
            }
        }
    });
};