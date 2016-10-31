// ==UserScript==
// @name Test
// @include http://*
// ==/UserScript==

(function($,window,document){

	var colorNumber = 0;
	var colors = ['pink', 'yellow', 'lightblue'];

	window.setInterval(function() {
		$("body").css("background",colors[colorNumber++]);
		if(colorNumber > colors.length) {
			colorNumber = 0;
		}
	}, 1000);
	
})(__chaterbox_jquery__,window,document);

