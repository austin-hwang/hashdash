var http = require('http');
var express, app;
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');

try {
  express = require('express');
  app = express();
  app.listen(1337, function () {
    console.log("Started on port 1337");
  })
  app.use(bodyParser.urlencoded({
    extended: true
  }), bodyParser.json(), function (req, res, next) {
    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });

  app.post("/get-score", function (req, res) {
    exports.getScore(req, res);
  });
} catch (err) {

}

exports.getScore = function (req, res) {
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('Access-Control-Allow-Credentials', true);

  var totalCount = 0;
  var totalScore = 0;
  var jobTitle = req.body.title;

  console.log(req.body);
  console.log(req.body.title);
  console.log(req.body.headline);
  console.log(req.body.summary);
  console.log(req.body.connections);

  request('https://us-central1-hatchdash.cloudfunctions.net/get-skills?jobTitle=' + req.body.title, function (error, response, body) {
    //http://localhost:1234/get-skills?jobTitle=
    //https://us-central1-hatchdash.cloudfunctions.net/get-skills?jobTitle=
    console.log('error:', error); // Print the error if one occurred 
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    var data = JSON.parse(body);

    var headlineScore = 0;
    var summaryScore = 0;
    var connectionScore = 0;
    var positionScore = 0;
    var countArray = [];
    var nameArray = [];
    var totalArray = [];
    var suggestions = [];
    var skillsSuggestion = "";

    for (var i = 0; i < data.skills.length; i++) {
      countArray.push(data.skills[i].count);
      nameArray.push(data.skills[i].name);
    }

    while (countArray.length > 10) {
      var index = countArray.indexOf(Math.min.apply(Math, countArray));
      countArray.splice(index, 1);
      nameArray.splice(index, 1);
    }

    for (var i = 0; i < countArray.length; i++) {
      totalArray.push({ count: countArray[i], name: nameArray[i] });
    }

    totalArray.sort(dynamicSort("count"));

    console.log(totalArray);

    /*for (var i = 0; i < countArray.length; i++) {
      totalCount += countArray[i];
    }*/

    var counter = 0;

    for (var i = 0; i < totalArray.length; i++) {
      if (req.body.headline.toLowerCase().indexOf(totalArray[i].name) != -1) {
        headlineScore += ((i + 1) / 85) * 100;
      }

      if (req.body.summary.toLowerCase().indexOf(nameArray[i]) != -1) {
        summaryScore += ((i + 1) / 55) * 100;
        counter++;
      } else {
        suggestions.push(nameArray[i]);
      }

      if (req.body.positionSummary.toLowerCase().indexOf(nameArray[i]) != -1 || req.body.positionTitle.toLowerCase().indexOf(nameArray[i]) != -1) {
        positionScore += ((i + 1) / 55) * 100;
      }
    }

   /*var split = jobTitle.split(" ");

    for (var i = 0; i < split.length; i++) {
      if (req.body.headline.toLowerCase().indexOf(split[i]) === -1) {
        contains = false;
      }
    }

    if (true) {
      headlineScore += 30;
    }*/

    //Need to add score if headline matches job title query

    console.log(headlineScore, summaryScore, positionScore, connectionScore);
    connectionScore = .1 * (req.body.connections / 500) * 100;
    headlineScore = .3 * headlineScore;
    summaryScore = .2 * ((.3 * summaryScore) + (.7 * counter / 5 * 100));
    positionScore = .15 * positionScore;
    console.log(headlineScore, summaryScore, positionScore, connectionScore);
    totalScore = Math.round((headlineScore + summaryScore + positionScore + connectionScore + 25) * 100) / 100;
    console.log(totalScore);

    res.write("Your profile score is: " + totalScore.toString() + "/100.00" + "</br>");
    for (var i = 0; i < suggestions.length; i++) {
      if (i != suggestions.length - 1) {
        skillsSuggestion = skillsSuggestion.concat(suggestions[i] + ", ");
      } else {
        skillsSuggestion = skillsSuggestion.concat("and " + suggestions[i] + ".");
      }
    }

    res.write("-To further strenghten your profile, add the following skills to your profile headline, summary, or job descriptions: " + skillsSuggestion + "</br>");
    if (req.body.connections < 500) {
      res.write("-Consider adding " + (500 - req.body.connections).toString() + " connections to your profile.")
    }

    res.end();
    
  });

}

function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
}
