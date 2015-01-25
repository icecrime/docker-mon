// dependencies
var humanize = require('humanize'),
    util     = require('util')

NetworkIO = function (boxWidget) {
    // allow use without new operator
    if (!(this instanceof NetworkIO)) {
        return new NetworkIO(boxWidget)
    }

    this.box = boxWidget
}

NetworkIO.prototype.update = function (statItem) {
    var boxContent = util.format(
            "rx_bytes   = %s\n" +
            "rx_dropped = %d\n" +
            "rx_errors  = %d\n" +
            "rx_packets = %d\n" +
            "tx_bytes   = %s\n" +
            "tx_dropped = %d\n" +
            "tx_errors  = %d\n" +
            "tx_packets = %d\n",
            humanize.filesize(statItem.network.rx_bytes),
            statItem.network.rx_dropped,
            statItem.network.rx_errors,
            statItem.network.rx_packets,
            humanize.filesize(statItem.network.tx_bytes),
            statItem.network.tx_dropped,
            statItem.network.tx_errors,
            statItem.network.tx_packets
    )
    this.box.setText(boxContent)
}

exports.NetworkIO = NetworkIO
