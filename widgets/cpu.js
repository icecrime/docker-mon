// dependencies
var moment = require('moment')

calculateCPUPercent = function(statItem, previousCpu, previousSystem) {
    var cpuDelta = statItem.cpu_stats.cpu_usage.total_usage - previousCpu
    var systemDelta = statItem.cpu_stats.system_cpu_usage - previousSystem

    var cpuPercent = 0.0
    if (systemDelta > 0.0 && cpuDelta > 0.0) {
        cpuPercent = (cpuDelta / systemDelta) * statItem.cpu_stats.cpu_usage.percpu_usage.length * 100.0
    }
    if(cpuPercent < 150){
        return cpuPercent
    } else {
        return 0;
    }
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

CPUPercentageLine.prototype.clear = function(){
    this.x              = []
    this.y              = []
//    this.previousCpu    = 0.0
//    this.previousSystem = 0.0
}

CPUPercentageLine.prototype.update = function (statItem) {
    var maxDataPoints = 60
    if (this.x.length > maxDataPoints) {
        this.x.shift();
    }
    if (this.y.length > maxDataPoints) {
        this.y.shift();
    }

    var cpuPercent = calculateCPUPercent(statItem, this.previousCpu, this.previousSystem)
    //this.x.push(moment(statItem.read).format("HH:mm:ss"))
  this.y.push(cpuPercent)
  this.x = [];
  for (var i = 0; i <= this.y.length; i++) {
    this.x.push(i-1);
  }
  this.x = this.x.reverse().map(function(n){return n.toString()})
    this.previousCpu = statItem.cpu_stats.cpu_usage.total_usage
    this.previousSystem = statItem.cpu_stats.system_cpu_usage

    this.line.setData(this.x, this.y);
}

exports.CPUPercentageLine = CPUPercentageLine
exports.calculateCPUPercent = calculateCPUPercent
