#!/usr/bin/env node

// dependencies
var cli     = require('cli'),
    request = require('request')
    utils   = require('./utils'),

    blessed  = require('blessed'),
    contrib  = require('blessed-contrib'),
    moment   = require('moment'),
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

var cpuPointBuilder = function(statItem) {
    var cpuPercent = 0.0
    var cpuDelta = statItem.cpu_stats.cpu_usage.total_usage - this.previousCpu
    var systemDelta = statItem.cpu_stats.system_cpu_usage - this.previousSystem
    if (systemDelta > 0.0 && cpuDelta > 0.0) {
        cpuPercent = (cpuDelta / systemDelta) * statItem.cpu_stats.cpu_usage.percpu_usage.length * 100.0
    }

    this.previousCpu = statItem.cpu_stats.cpu_usage.total_usage
    this.previousSystem = statItem.cpu_stats.system_cpu_usage

    return {
        x: moment(statItem.read).format("HH:mm:ss"),
        y: cpuPercent
    }
}

cpuPointBuilder.previousCpu    = 0.0
cpuPointBuilder.previousSystem = 0.0

var fetchContainerDetails = function(containerID, detailBox) {
    request({
        json: true,
        method: 'GET',
        uri: host + '/containers/' + containerID + '/json'
    }, function(err, resp, body) {
        detailBox.setLabel("Container details: " + containerID.substr(0, 8))

        if (err) {
            return detailBox.setText("Error fetching container info: " + err)
        }

        if (resp.statusCode != 200) {
            return detailBox.setText("Error fetch container info (" + resp.statusCode + "), error: " + body)
        }

        detailBox.setText(JSON.stringify(body, undefined, 2))
        screen.render()
    })
}

// Get the containers.
parse(function(containers) {
    if (containers.length <= 0){
        return cli.err("No containers.")
    }

    // Create upper nested grid.
    var upperGrid = new contrib.grid({rows: 1, cols: 2})
    upperGrid.set(0, 0, contrib.table, {
        columnSpacing: [14, 32, 10],
        label: "Running containers",
        parent: screen // workaround a blessed bug
    })
    upperGrid.set(0, 1, blessed.box, {
        fg: "green",
        label: "Container details",
        scrollable: true
    })

    var bottomGrid = new contrib.grid({rows: 1, cols: 1})
    bottomGrid.set(0, 0, contrib.line, {
        label: "CPU %",
        maxY: 100,
    })

    //var gaugesGrid = new contrib.grid({rows: 2, cols: 1})
    //gaugesGrid.set(0, 0, contrib.gauge, {label: "CPU %"})
    //gaugesGrid.set(1, 0, contrib.gauge, {label: "MEM %"})
    //bottomGrid.set(0, 1, gaugesGrid)

    // Create global grid layout.
    var globalGrid = new contrib.grid({rows: 2, cols: 1})
    globalGrid.set(0, 0, upperGrid)
    globalGrid.set(1, 0, bottomGrid)
    globalGrid.applyLayout(screen);

    // Name lines widgets.
    var cpuLine = bottomGrid.get(0, 0)

    // Create container detail view.
    var containerDetailBox = upperGrid.get(0, 1)

    // Create container list.
    var containersTable = upperGrid.get(0, 0)
    containersTable.setData({
        headers: ["ID", "Names", "Image"],
        data: containers.map(function(el) {
            return [el.Id.substr(0, 8), el.Names.join(", "), el.Image]
        })
    })
    containersTable.rows.on("select", function(item) {
        // Get container data, update detail view.
        var containerData = containers[containersTable.rows.getItemIndex(item)]
        fetchContainerDetails(containerData.Id, containerDetailBox)

        // Clear graphs and start collecting container stats.
        cpuLine.setData([], [])
        utils.GetStats(host, containerData.Id, cpuLine, screen, cpuPointBuilder)
    })
    containersTable.focus()

    // Render screen.
    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        return process.exit(0)
    });
    screen.render();
});
