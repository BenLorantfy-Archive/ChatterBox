// ==UserScript==
// @name Test
// @include http://*
// ==/UserScript==

(function($,window,document){
	// [ Get's comment box markup ]
	var url = kango.io.getResourceUrl('res/box.html');
	$.get(url,function(box){
		$("body").append(box);
	});
	
})(__chaterbox_jquery__,window,document);

