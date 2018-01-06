const fs = require('fs');
const indeed = require('../indeed/indeed');

var scrape = (q) => {
    // call getJobs function from indeed module to get an array of job obejects
    indeed.getJobs({ query: q }, (error, jobTitle, jobs) => {
        if (error) {
            console.log(error);
        } else {
            indeed.scrapeJobs(jobTitle, jobs, (error, files) => {
                (error) ? console.log(error) : console.log("finish scraping", jobTitle);
            });
        }
    });
};

module.exports = {
    scrape
};