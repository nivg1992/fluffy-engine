/**
 * Created by niv.gabay on 17/07/2017.
 */
var rp = require('request-promise');
const Q = require('q');

module.exports = class widgetAnalize {
    constructor(token, url, frequencyDashboards,redisClient) {
        let me = this;
        this.url = url;
        this.redisClient = redisClient;
        this.accessToken = token;
        // return rp({
        //     method: 'POST',
        //     uri: url + "/api/v1/authentication/login",
        //     body: {"username": user, "password": password},
        //     json: true
        // })
        return Q.all(frequencyDashboards.map((dashboardID) => {
            return rp({
                method: 'GET',
                uri: me.url + "/api/v1/dashboards/" + dashboardID + "/widgets",
                headers: {"Authorization": "Bearer " + me.accessToken, "content-type": "application/json"},
                json: true,
                timeout: 120000,
            }).then((response) => {
                return new Promise((resolve, reject) => {
                    me.result = [];
                    return Q.all(response.map((widget) => {
                        return new Promise(resolve1 => {
                            me.redisClient.keys("*:" + widget.oid, function (e, r) {
                                if (r.length == 0) {
                                    resolve1({
                                        uri: me.url + "/api/v1/dashboards/" + dashboardID + "/widgets/" + widget.oid + "/export/png?width=400&height=300",
                                        widget
                                    })
                                } else {
                                    resolve1(undefined);
                                }
                            });
                        })
                    })).then(funcs => {
                        me.loadPNG(funcs.filter((item) => item ? item : false), 0, (results) => {
                            resolve(results);
                        });
                    });

                });
            });
        }));
    }

    loadPNG(uris,index) {
        let me = this;
        return Q.all([this.getPNGByWidget(uris[index+1].uri,uris[index+1].widget),
               this.getPNGByWidget(uris[index+2].uri,uris[index+2].widget),
               this.getPNGByWidget(uris[index+3].uri,uris[index+3].widget),
               this.getPNGByWidget(uris[index+4].uri,uris[index+4].widget)])
         .then(() => {
             if(uris.length != index + 5) {
                 me.loadPNG(uris,index + 5);
             }
        });
    }

    getPNGByWidget(uri,widget) {
        let me = this;

        return rp({
            method: 'GET',
            uri: uri,
            headers: {"Authorization": "Bearer " + me.accessToken,"Content-Type":"text/html"},
            encoding: null
        }).then(png => {
            me.redisClient.set(widget.title.toLowerCase() + ":" + widget.oid,png.toString('base64'));
        }).catch((e) => {
            console.error(e.message + "////" + e.options.uri);
        });
    }
};