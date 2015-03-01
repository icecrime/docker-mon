'use strict'

// dependencies
var path     = require('path'),
    request  = require('request'),
    // container connections
    ccs = [];

// function to get all containers
function GetAllContainers(host, func) {
    request({
        json:   true,
        method: 'GET',
        uri:    host + '/containers/json'
    }, function (err, resp, body) {
        var containers = [];

        if (err) {
            return func(err, containers);
        }

        if (resp.statusCode != 200) {
            return func(new Error("Status from server was: " + resp.statusCode), containers);
        }

        if (body.length <= 0) {
            return func(new Error("You have no containers currently.", containers))
        }

        body.forEach(function(el) {
            containers.push(el)
        });

        return func(err, containers);
    });
};

function GetStats(host, containerID, statsCB) {
  ccs.map(function(e){
    e.destroy();
    ccs.pop();
  })
  ccs.push(request({
    json:   true,
    method: 'GET',
    uri:    host + '/containers/' + containerID + '/stats'
  })
           .on('data', function(data){
             statsCB(JSON.parse(data))
           }))
};

exports.GetAllContainers = GetAllContainers;
exports.GetStats         = GetStats;
