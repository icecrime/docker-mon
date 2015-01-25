'use strict'

// dependencies
var path     = require('path'),
    request  = require('request'),
    stream   = require('stream'),
    util     = require('util'),
    Writable = stream.Writable;

// function to get all containers
function GetAllContainers(host, func) {
    request({
        json:   true,
        method: 'GET',
        uri:    host + '/containers/json?all=1'
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

        var containers
        body.forEach(function(el) {
            containers.push(el)
        });

        return func(err, containers);
    });
};

function StatsStream(el, statsCb, options) {
    // allow use without new operator
    if (!(this instanceof StatsStream)) {
        return new StatsStream(el, options);
    }

    Writable.call(this, options);
    this.el      = el;
    this.statsCb = statsCb
};
util.inherits(StatsStream, Writable);
StatsStream.prototype._write = function (chunk, enc, cb) {
        chunk = chunk.toString();
        try {
            chunk = JSON.parse(chunk);
        } catch (e) {
            console.log(chunk, "is not JSON");
            return cb();
        }

        this.statsCb(chunk);
        return cb();
};

function GetStats(host, containerID, statsCb) {
    var sstream = new StatsStream(containerID, statsCb);

    sstream.on('finish', function () {
        console.log('finished writing for', containerID);
    });

    request({
        json:   true,
        method: 'GET',
        uri:    host + '/containers/' + containerID + '/stats'
    }).pipe(sstream);
};

exports.GetAllContainers = GetAllContainers;
exports.GetStats         = GetStats;
