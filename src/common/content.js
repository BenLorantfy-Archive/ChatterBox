// ==UserScript==
// @name Test
// @include http://*
// ==/UserScript==

var colorNumber = 0;
var colors = ['red', 'green', 'blue'];

window.setInterval(function() {
    document.body.style.background = colors[colorNumber++];
    if(colorNumber > colors.length) {
        colorNumber = 0;
    }
}, 1000);