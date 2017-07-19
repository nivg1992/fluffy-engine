var express = require('express');
var NLP = require('./NLP');
var widgetAnalize = require('./widgetAnalize');
var app = express();
var redis = require("redis"),
    client = redis.createClient();
const Q = require('q');
let user = "eitans@sisense.com";
let password = "Sisense";


let frequencyDashboards = ["596d1e2ac994d02823000bfc"];
let a = new widgetAnalize("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiNTZmYTJiYWJlNzQ5NmIwMDAwMDAwMmQxIiwiYXBpU2VjcmV0IjoiZGQzYTRhMTgtZDBjYi05YWUzLTA2MDItOTRlMjBhOGNmYzkxIiwiaWF0IjoxNTAwMzA5MjY3fQ.eJMn3ZLctetgzGo8agejeW91VR9J532G_Yx9zs-cpq4",
                          "http://sibi.sisense.com", frequencyDashboards, client);


client.on("error", function (err) {
    console.log("Redis Error " + err);
});

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(express.static('public'));

app.get('/getWidgetsByTags', function (req, res) {
    let UserText = req.query.text;
    let response = {};
    NLP.getTagsFromText(UserText).then(tags => {
        response.UserText = UserText;
        Q.all(tags.map((item) => {
            return new Promise(resolve => {
                client.keys(item.name.toLowerCase() + ":*", function (e, r) {
                    if (r) {
                        Q.all(r.map((key) => {
                            return new Promise(resolve => {
                                client.get(key, function (e, r) {
                                    resolve({key, png: r});
                                })
                            })

                        })).then((values) => {

                            let tagsPNG = {name: item.name};
                            tagsPNG.data = [];
                            values.forEach((data) => {
                                tagsPNG.data.push(data.png.toString("base64"));
                            });

                            resolve(tagsPNG);
                        });
                    }
                });
            });
        })).then(tagsData => {
            response.tags = tagsData;

            res.send(response)
        });
    });
});

var server = app.listen(8094, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
});