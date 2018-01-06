'use strict';

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

module.exports = Job;