function ChatterBox() {
    var self = this;

    // var token = kango.storage.getItem("token");



    kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function() {
		kango.browser.tabs.getCurrent(function(tab) {
			tab.dispatchMessage('BrowserButtonClick');
		});
    });
}

var extension = new ChatterBox();