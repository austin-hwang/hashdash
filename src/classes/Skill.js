'use strict';

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

module.exports = Skill;