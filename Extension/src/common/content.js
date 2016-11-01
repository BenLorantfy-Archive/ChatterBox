// ==UserScript==
// @name Test
// @include http://*
// ==/UserScript==

(function($,window,document){
	// [ Get's comment box markup ]
	var url = kango.io.getResourceUrl('res/box.html');
	// $.get(url,function(box){
		
		var width = 400;
		var iframe = $("<iframe id = '__chatterbox__iframe__'></iframe>");
		$("body").prepend(iframe);
		iframe.css({
			 "position": "fixed"
			,"right": width * -1.2
			,"top":0
			,"width": width
			,"height":"100%"
			,"background-color":"white"
			,"z-index":9999999
			,"-webkit-box-shadow":"-2px 0px 5px 0px rgba(0,0,0,0.75)"
			,"-moz-box-shadow":"-2px 0px 5px 0px rgba(0,0,0,0.75)"
			,"box-shadow":"-2px 0px 5px 0px rgba(0,0,0,0.75)"
			,"border":"none"
		});
		
		iframe.attr("src",url);

		// var dstFrame = iframe[0];
		// var dstDoc = dstFrame.contentDocument || dstFrame.contentWindow.document;
		// dstDoc.write(box);
		// dstDoc.close();
		
		var open = false;
		kango.addMessageListener('BrowserButtonClick', function(event) {
			
			iframe.stop().animate({
				right: open ? iframe.width() * -1.2 : 0
			}, 400, function() {
				// Animation complete.
			});
			
			open = !open;
		});
	// });
	
	function replaceAll(target, search, replacement) {
		return target.split(search).join(replacement);
	};
	
})(__chatterbox_jquery__,window,document);

