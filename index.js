#!/usr/bin/env node

// dependencies
var cli     = require('cli'),
    request = require('request'),
    utils   = require('./utils'),
    widgets = require('./widgets'),

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
var parse = function (func){
    if (cli.args.length) {
        return func(cli.args);
    }

    utils.GetAllContainers(host, function (err, containers){
        if (err) {
            return cli.error(err);
        }

        return func(containers);
    });
};

var fetchContainerDetails = function (containerID, detailBox) {
    request({
        json: true,
        method: 'GET',
        uri: host + '/containers/' + containerID + '/json'
    }, function(err, resp, body) {
        detailBox.setLabel("Container details: " + containerID.substr(0, 8) + " (use j/k to scroll)")

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

// Get the containers
parse(function (containers) {
    if (containers.length <= 0){
        return cli.error("No containers.")
    }

    // Create upper nested grid
    var upperGrid = new contrib.grid({rows: 1, cols: 2})
    upperGrid.set(0, 0, contrib.table, {
        columnSpacing: [14, 32, 10],
        label: "Running containers (use arrows/enter to select)",
        parent: screen // workaround a blessed bug
    })
    upperGrid.set(0, 1, blessed.box, {
        fg: "green",
        label: "Container details",
        scrollable: true
    })

    var bottomGrid = new contrib.grid({rows: 1, cols: 2})
    bottomGrid.set(0, 0, contrib.line, {
        label: "CPU %",
        maxY: 100,
        showNthLabel: 10,
        style: {
            baseline: "white"
        },
        xPadding: 0
    })

    var gaugesGrid = new contrib.grid({rows: 1, cols: 2})
    gaugesGrid.set(0, 0, contrib.gauge, {label: "CPU %"})
    gaugesGrid.set(0, 1, contrib.gauge, {label: "MEM %"})

    var bottomRightGrid = new contrib.grid({rows: 2, cols: 1})
    bottomRightGrid.set(0, 0, gaugesGrid)
    bottomRightGrid.set(1, 0, blessed.box, {
        fg: "green",
        label: "Network",
        padding: {
            left: 1
        }
    })

    bottomGrid.set(0, 1, bottomRightGrid)

    // Create global grid layout
    var globalGrid = new contrib.grid({rows: 2, cols: 1})
    globalGrid.set(0, 0, upperGrid)
    globalGrid.set(1, 0, bottomGrid)
    globalGrid.applyLayout(screen);

    // Name widgets
    var cpuLine = bottomGrid.get(0, 0)
    var cpuGauge = gaugesGrid.get(0, 0)
    var memGauge = gaugesGrid.get(0, 1)
    var networkBox = bottomRightGrid.get(1, 0)
    cpuLine.canvasSize.width -= 12 // workaround to avoid overflowing the X labels

    // Create container detail view
    var containerDetailBox = upperGrid.get(0, 1)

    // Create container list
    var containersTable = upperGrid.get(0, 0)
    containersTable.setData({
        headers: ["ID", "Names", "Image"],
        data: containers.map(function (el) {
            return [el.Id.substr(0, 8), el.Names.join(", "), el.Image]
        })
    })
    containersTable.rows.on("select", function (item) {
        // Get container data, update detail view
        var containerData = containers[containersTable.rows.getItemIndex(item)]
        fetchContainerDetails(containerData.Id, containerDetailBox)

        // Clear graphs and start collecting container stats
        var elements = [
            new widgets.CPUPercentageLine(cpuLine),
            new widgets.CPUGauge(cpuGauge),
            new widgets.MEMGauge(memGauge),
            new widgets.NetworkIO(networkBox)
        ]
        utils.GetStats(host, containerData.Id, function (statItem) {
            elements.map(function (el) { el.update(statItem) })
            screen.render()
        })
    })
    containersTable.focus()

    // Key bindings
    screen.key('j', function (ch, key) {
        containerDetailBox.setScrollPerc(containerDetailBox.getScrollPerc() + 10)
    });
    screen.key('k', function (ch, key) {
        containerDetailBox.setScrollPerc(containerDetailBox.getScrollPerc() - 10)
    });
    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit(0)
    });

    // Render screen
    screen.render();
});
