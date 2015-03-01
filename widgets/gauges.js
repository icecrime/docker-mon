// dependencies
var cpu = require('./cpu.js')

CPUGauge = function (gaugeWidget) {
    // allow use without new operator
    if (!(this instanceof CPUGauge)) {
        return new CPUGauge(gaugeWidget)
    }

    this.gauge          = gaugeWidget
    this.previousCpu    = 0.0
    this.previousSystem = 0.0
}

CPUGauge.prototype.clear = function(){
    this.previousCpu    = 0.0
    this.previousSystem = 0.0
}

CPUGauge.prototype.update = function (statItem) {
    var cpuPercent = cpu.calculateCPUPercent(statItem, this.previousCpu, this.previousSystem)
    this.gauge.setPercent(Math.round(cpuPercent))
    this.previousCpu = statItem.cpu_stats.cpu_usage.total_usage
    this.previousSystem = statItem.cpu_stats.system_cpu_usage
}

MEMGauge = function (gaugeWidget) {
    // allow use without new operator
    if (!(this instanceof MEMGauge)) {
        return new MEMGauge(gaugeWidget)
    }

    this.gauge = gaugeWidget
}

MEMGauge.prototype.update = function (statItem) {
    var memPercent = statItem.memory_stats.usage / statItem.memory_stats.limit
    this.gauge.setPercent(Math.round(memPercent))
}

exports.CPUGauge = CPUGauge
exports.MEMGauge = MEMGauge
