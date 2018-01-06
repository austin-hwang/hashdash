const schedule = require('node-schedule');
const scrapeData = require('./modules/scrapeData/scrapeData');
const jobsMapping = require('./modules/jobsMapping/jobsMapping');

// execute function everyday at midnight
// args => *    *    *    *    *    *
//         ┬    ┬    ┬    ┬    ┬    ┬
//         │    │    │    │    │    |
//         │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
//         │    │    │    │    └───── month (1 - 12)
//         │    │    │    └────────── day of month (1 - 31)
//         │    │    └─────────────── hour (0 - 23)
//         │    └──────────────────── minute (0 - 59)
//         └───────────────────────── second (0 - 59, OPTIONAL)
//
schedule.scheduleJob(' 0 0 * * *', () => {
    console.log('Executing daily scrape data');

    let jobs = jobsMapping.getJobTitles();

    jobs.forEach(function (job) {
        scrapeData.scrape(job);
    }, this);
});