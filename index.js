#!/usr/bin/env node

// dependencies
var cli     = require('cli'),
    request = require('request'),
    utils   = require('./utils'),
    widgets = require('./widgets'),

    blessed  = require('blessed'),
    contrib  = require('blessed-contrib'),
    screen   = blessed.screen(),

    _ = require('lodash');

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

    var borderColor = "cyan"
    var labelStyle = {
        fg: "white",
        bold: true
    }

    // Create upper nested grid
    var upperGrid = new contrib.grid({rows: 1, cols: 2})
    upperGrid.set(0, 0, contrib.table, {
        columnSpacing: [14, 32, 10],
        label: "Running containers (use arrows/enter to select)",
        parent: screen, // workaround a blessed bug
        style: {
            label: labelStyle
        }
    })
    upperGrid.set(0, 1, blessed.box, {
        fg: "default",
        label: "Container details",
        scrollable: true,
        style: {
            label: labelStyle
        }
    })

    var bottomGrid = new contrib.grid({rows: 1, cols: 2})
    bottomGrid.set(0, 0, contrib.line, {
        label: "CPU %",
        maxY: 100,
        showNthLabel: 10,
        style: {
            baseline: "white",
            label: labelStyle,
            line: "yellow",
            text: "white"
        }
    })

    var gaugesGrid = new contrib.grid({rows: 1, cols: 2})
    gaugesGrid.set(0, 0, contrib.gauge, {
        label: "CPU %",
        style: {
            label: labelStyle
        }
    })
    gaugesGrid.set(0, 1, contrib.gauge, {
        label: "MEM %",
        style: {
            label: labelStyle
        }
    })

    var bottomRightGrid = new contrib.grid({rows: 2, cols: 1})
    bottomRightGrid.set(0, 0, gaugesGrid)
    bottomRightGrid.set(1, 0, blessed.box, {
        label: "Network",
        padding: {
            left: 1
        },
        style: {
            label: labelStyle
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

    cpuLine.border.style.fg = borderColor
    cpuGauge.border.style.fg = borderColor
    memGauge.border.style.fg = borderColor
    networkBox.border.style.fg = borderColor
    cpuLine.canvasSize.width -= 12 // workaround to avoid overflowing the X labels

    // Create container detail view
    var containerDetailBox = upperGrid.get(0, 1)
    containerDetailBox.border.style.fg = borderColor

    // Create container list
    var containersTable = upperGrid.get(0, 0)

    // debounce call to containers endpoint because many events can happen at
    // "once"
    var updateContainers = _.debounce(function(){
        utils.GetAllContainers(host, function (err, containers){
            if(err) throw err;
            containersTable.setData({
                headers: ["ID", "Names", "Image"],
                data: containers.map(function (el) {
                    return [el.Id.substr(0, 8), el.Names.join(", "), el.Image]
                })
            })
            // If we don't render, you have to take action in the terminal for the
            // screen to re-render the current containers.
            screen.render()
        })
    }, 200)

    // listen to events api to update "Running Containers" list
    request({
        json:   true,
        method: 'GET',
        uri:    host + '/events'
    })
        .on('data', function(data){
            // we don't care about data, just that something happened
            updateContainers();
        })
    
    containersTable.setData({
        headers: ["ID", "Names", "Image"],
        data: containers.map(function (el) {
            return [el.Id.substr(0, 8), el.Names.join(", "), el.Image]
        })
    })
        var elements = [
            new widgets.CPUPercentageLine(cpuLine),
            new widgets.CPUGauge(cpuGauge),
            new widgets.MEMGauge(memGauge),
            new widgets.NetworkIO(networkBox)
        ]
    containersTable.rows.on("select", function (item) {
        // Get container data, update detail view
        var containerData = containers[containersTable.rows.getItemIndex(item)]
        fetchContainerDetails(containerData.Id, containerDetailBox)

        // Clear graphs and start collecting container stats
        elements.map(function(e){
            if(typeof e.clear == 'function' || false){
                e.clear()
            }
        })
        utils.GetStats(host, containerData.Id, function (statItem) {
            elements.map(function (el) { el.update(statItem) })
            screen.render()
        })
    })
    containersTable.border.style.fg = borderColor  // override blessed-contrib border color (cyan)
    containersTable.rows.style.item.fg = "default" // override blessed-contrib item color (green)
    containersTable.style.fg = "cyan"              // override blessed-contrib headers color (fg)
    containersTable.style.bold = true              // override blessed-contrib headers style
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
