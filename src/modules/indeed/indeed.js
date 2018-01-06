const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

const jobsMapping = require('../jobsMapping/jobsMapping');

const jtr_source = 'indeed'

/** 
 * Get jobs from Indeed API
 * 
 * @param {Object} q - an object that contain params for sending to the API
 * query     => By default terms are ANDed. To see what is possible, use our advanced search page to perform a search and then check the url for the q value
 * location  => Location. Use a postal code or a "city, state/province/region" combination
 * userip    => The IP number of the end-user to whom the job results will be displayed. This field is required
 * useragent => The User-Agent (browser) of the end-user to whom the job results will be displayed. This can be obtained from the "User-Agent" HTTP request header from the end-user. This field is required
 * start     => Start results at this result number, beginning with 0. Default is 0
 * limit     => Maximum number of results returned per query. Default is 25. Maximum is 25
 * 
 * @param {requestCallback} callback - a callback function that handles the response
 * 
 * cr. http://www.newmediacampaigns.com/blog/building-an-indeed-job-search-page-on-your-site
 */
var getJobs = (q, callback) => {
    let query = q.query || '';
    let location = q.location || 'San Francisco Bay Area, CA';
    let userip = q.userip || '1.2.3.4';
    let useragent = q.useragent || 'Mozilla//4.0(Firefox)';
    let start = q.start || 0;

    let uri = `http://api.indeed.com/ads/apisearch?publisher=4477264408672364&format=json&q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=&radius=50&st=jobsite&jt=&start=${start}&limit=100&fromage=&filter=&latlong=1&co=us&chnl=&userip=${userip}&useragent=${encodeURIComponent(useragent)}&v=2`;

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

var scrapeJob = (jobTitle, job, callback) => {
    let jobMapping = jobsMapping.getJobMapData(jobTitle);

    let fileName = `indeed_${job.jobkey}`;

    jobsMapping.pushIfNotExist(jobMapping, jobTitle, fileName);

    scrapeData(job).then((file) => {
        jobsMapping.writeJobMapData(jobMapping);

        callback(undefined, file);
    }).catch((error) => {
        console.log(error);
    });
};

var scrapeJobs = (jobTitle, jobs, callback) => {
    let files = [];

    let jobMapping = jobsMapping.getJobMapData(jobTitle);

    jobs.forEach((job) => {
        let fileName = `indeed_${job.jobkey}`;

        jobsMapping.pushIfNotExist(jobMapping, jobTitle, fileName);

        scrapeData(job).then((file) => {
            files.push(file);

            if (files.length === jobs.length) {
                jobsMapping.writeJobMapData(jobMapping);

                callback(undefined, files);
            }
        }).catch((error) => {
            console.log(error);
        });
    });
};

var scrapeData = (job) => {
    return new Promise(function (resolve, reject) {

        let fileName = `indeed_${job.jobkey}`;
        let file = `${__dirname}/../../../data/jobsDesc/${fileName}`;

        // cut unnecessary data from url, make it shorter
        job.url = job.url.substring(0, job.url.indexOf('&qd='));

        request(job.url, (error, response, html) => {
            // console.log('calling: ', job.url);

            if (error) {
                reject(err);
            } else {
                var $ = cheerio.load(html);

                $('#job_summary').filter(function () {
                    job.jtr_description = $(this).text();

                    // marked that this job is from indeed
                    job.jtr_source = jtr_source;

                    fs.writeFileSync(file, JSON.stringify(job));
                });

                // console.log('created: ', file);

                resolve(file);
            }
        });
    });
};

module.exports = {
    getJobs,
    scrapeJob,
    scrapeJobs
};