// dependencies
var moment = require('moment')

calculateCPUPercent = function(statItem, previousCpu, previousSystem) {
    var cpuDelta = statItem.cpu_stats.cpu_usage.total_usage - previousCpu
    var systemDelta = statItem.cpu_stats.system_cpu_usage - previousSystem

    var cpuPercent = 0.0
    if (systemDelta > 0.0 && cpuDelta > 0.0) {
        cpuPercent = (cpuDelta / systemDelta) * statItem.cpu_stats.cpu_usage.percpu_usage.length * 100.0
    }
    return cpuPercent
}

CPUPercentageLine = function (lineWidget) {
    // allow use without new operator
    if (!(this instanceof CPUPercentageLine)) {
        return new CPUPercentageLine(lineWidget)
    }

    this.x              = []
    this.y              = []
    this.line           = lineWidget
    this.previousCpu    = 0.0
    this.previousSystem = 0.0
}

CPUPercentageLine.prototype.update = function (statItem) {
    var maxDataPoints = 10
    if (this.x.length > maxDataPoints) {
        this.x.shift();
    }
    if (this.y.length > maxDataPoints) {
        this.y.shift();
    }

    this.x.push(moment(statItem.read).format("HH:mm:ss"))
    this.y.push(calculateCPUPercent(statItem, this.previousCpu, this.previousSystem))

    this.previousCpu = statItem.cpu_stats.cpu_usage.total_usage
    this.previousSystem = statItem.cpu_stats.system_cpu_usage

    this.line.setData(this.x, this.y);
}

exports.CPUPercentageLine = CPUPercentageLine
exports.calculateCPUPercent = calculateCPUPercent
