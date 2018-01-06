const express = require('express');
const skills = require('./modules/skills/skills');

var app = express();

app.use(express.static(__dirname + '/../www'));
app.use("/assets", express.static(__dirname + '/../www'));

app.get('/', (req, res) => {
    res.send();
});

app.get('/skills', (req, res) => {
    res.send(skills.getSkills(req.query.q));
});

app.listen(8080, () => {
    console.log('Server is started on port 8080');
});