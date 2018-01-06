jtitle.onkeyup = function(e) {
  if(e.keyCode == 13) {
    findTrends(e.target.value);
  }
}

function findTrends(jobTitle) {
  var xhr =new XMLHttpRequest();
  xhr.open('GET', 'https://us-central1-hatchdash.cloudfunctions.net/get-skills?jobTitle=' + jobTitle.replace(' ', '+'), true);
  //https://us-central1-hatchdash.cloudfunctions.net/get-skills?jobTitle=
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        console.log(xhr.responseText);
        // var div = document.createElement('div');
        var result = JSON.parse(xhr.responseText);
        // div.textContent = 'Data from ' + result.jobscount + ' jobs';
        // document.body.appendChild(div);

        document.getElementById("footer").innerHTML = 'Data from ' + result.jobscount + ' jobs';
        d3.select("svg").remove();

        if (result.jobscount === 0)
        {
           document.getElementById("graphic").style.display = "none";
           
        }
        else
        {
            document.getElementById("graphic").style.display = "initial";
            displaySkills(result.skills);
        }
      
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.send();
}

function displaySkills(data) {

  data.sort(function(a,b) {
    return a.score - b.score;
  })

  data = data.slice(-20);

  //set up svg using margin conventions - we'll need plenty of room on the left for labels
  var margin = {
      top: 15,
      right: 200,
      bottom: 15,
      left: 200
  };

  var width = 1200 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

  var svg = d3.select("#graphic").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scale.linear()
      .range([0, width])
      .domain([0, d3.max(data, function (d) {
          return d.score;
      })]);

  var y = d3.scale.ordinal()
      .rangeRoundBands([height, 0], .1)
      .domain(data.map(function (d) {
          return d.name;
      }));

  //make y axis to show bar names
  var yAxis = d3.svg.axis()
      .scale(y)
      //no tick marks
      .tickSize(0)
      .orient("left");

  var gy = svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)

  var bars = svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("g")

  //append rects
  bars.append("rect")
      .attr("class", "bar")
      .attr("y", function (d) {
          return y(d.name);
      })
      .attr("height", y.rangeBand())
      .attr("x", 8)
      .attr("width", function (d) {
          return x(d.score);
      })
      .on('mouseenter', function (d) {
        console.log(d.jobs)
      });

  //add a value label to the right of each bar
  bars.append("text")
      .attr("class", "label")
      //y position of the label is halfway down the bar
      .attr("y", function (d) {
          return y(d.name) + y.rangeBand() / 2 + 4;
      })
      //x position is 3 pixels to the right of the bar
      .attr("x", function (d) {
          return x(d.score) + 12;
      })
      .text(function (d) {
          return 'matches ' + d.jobs.length + ' jobs';
      })
      .attr("onclick", function (d) {
        return "console.log()"
      });
}

// displaySkills(
// [{"name":"javascript","count":12,"score":6,"jobs":[{"title":"Senior Software Engineer @ GreatHorn","url":"http://www.indeed.com/viewjob?jk=085c0a7f4d701a7f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"},{"title":"FrontEnd Developer with Node.js and React Native","url":"http://www.indeed.com/viewjob?jk=0fdc14ae213f153d&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"},{"title":"Node.js Developer","url":"http://www.indeed.com/viewjob?jk=4b3a5d435acc292f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"python","count":1,"score":1.5,"jobs":[{"title":"Senior Software Engineer @ GreatHorn","url":"http://www.indeed.com/viewjob?jk=085c0a7f4d701a7f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"java","count":2,"score":2.6666666666666665,"jobs":[{"title":"FrontEnd Developer with Node.js and React Native","url":"http://www.indeed.com/viewjob?jk=0fdc14ae213f153d&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"},{"title":"Node.js Developer","url":"http://www.indeed.com/viewjob?jk=4b3a5d435acc292f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"angular","count":1,"score":1.5,"jobs":[{"title":"FrontEnd Developer with Node.js and React Native","url":"http://www.indeed.com/viewjob?jk=0fdc14ae213f153d&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"react","count":5,"score":3.5,"jobs":[{"title":"FrontEnd Developer with Node.js and React Native","url":"http://www.indeed.com/viewjob?jk=0fdc14ae213f153d&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"reactnative","count":4,"score":3,"jobs":[{"title":"FrontEnd Developer with Node.js and React Native","url":"http://www.indeed.com/viewjob?jk=0fdc14ae213f153d&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"crossplatform","count":1,"score":1.5,"jobs":[{"title":"Node.js Developer","url":"http://www.indeed.com/viewjob?jk=4b3a5d435acc292f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"agile","count":2,"score":2,"jobs":[{"title":"Node.js Developer","url":"http://www.indeed.com/viewjob?jk=4b3a5d435acc292f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"nodejs","count":4,"score":3,"jobs":[{"title":"Node.js Developer","url":"http://www.indeed.com/viewjob?jk=4b3a5d435acc292f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]},{"name":"css","count":1,"score":1.5,"jobs":[{"title":"Node.js Developer","url":"http://www.indeed.com/viewjob?jk=4b3a5d435acc292f&qd=FXHIZ_Y1VrQzA1dadXKLCA…HpaH8N7v6mahpVOQiqI__4oHGA&indpubnum=4477264408672364&atk=1bfgpb25lavl084c"}]}]
// )
