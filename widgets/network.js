// dependencies
var humanize = require('humanize')

NetworkIO = function (boxWidget) {
    // allow use without new operator
    if (!(this instanceof NetworkIO)) {
        return new NetworkIO(boxWidget)
    }

    this.box = boxWidget
}

NetworkIO.prototype.update = function (statItem) {
    this.box.setText(humanize.filesize(statItem.network.rx_bytes) + " / " +
                     humanize.filesize(statItem.network.tx_bytes))
}

exports.NetworkIO = NetworkIO
