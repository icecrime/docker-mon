#!/usr/bin/env node

// dependencies
var cli     = require('cli'),
    request = require('request')
    utils   = require('./utils'),
    
    blessed  = require('blessed'),
    contrib  = require('blessed-contrib'),
    screen   = blessed.screen();

// enable status
cli.enable('status');

// initialize variables
var containers   = '',
    host         = process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
    isUnixSocket = (host.indexOf('unix') > -1);

// add the trailing `:` if it's a unix socket
if (isUnixSocket) {
    host += ":";
}
// backwards compatibility for unix format
if (isUnixSocket && host.substring(0, 8) == "unix:///") {
    host = host.replace("unix://", "http://unix:")
}

// parse command line arguments
var parse = function(func){
    if (cli.args.length) {
        return func(cli.args);
    }

    utils.GetAllContainers(host, function(err, containers){
        if (err) {
            return cli.err(err);
        }

        return func(containers);
    });
};

// get the containers
parse(function(containers) {
    if (containers.length <= 0){
        return cli.err("No containers.")
    }

    cli.info("Got containers: " + containers);
    
    // create the grid
    var grid;
    if (containers.length >= 1) {
        grid = new contrib.grid({rows: 1, cols: 1})
    } else {
        grid = new contrib.grid({rows: Math.ceil(containers.length/2), cols: 2});
    }

    // get the stats for the containers
    containers.forEach(function(el, i){
        grid.set(0, 0, contrib.line, {
            style: {
                line: "yellow",
                text: "green", 
                baseline: "black"
            },
            xLabelPadding: 3, 
            xPadding: 5, 
            label: 'cpu'
        });
        
        grid.applyLayout(screen);

        var line = grid.get(0, 0)
        
        screen.key(['escape', 'q', 'C-c'], function(ch, key) {
            return process.exit(0);
        });

        screen.render();

        utils.GetStats(host, el, line);
        
    });
});
