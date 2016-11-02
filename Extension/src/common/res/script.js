(function(){
	$.request.host = "http://localhost:8888/";

	var token = localStorage.getItem("token");

	if(!token){
		var iframe = $("#oauthIframe");
		$("#notLoggedIn").show();

	}else{
		doneLogin();
	}

	function popup(url, title, w, h, screenWidth, screenHeight) {
	    // Fixes dual-screen position                         Most browsers      Firefox
	    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
	    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
  
	    var left = ((screenWidth / 2) - (w / 2)) + dualScreenLeft;
	    var top = ((screenHeight / 2) - (h / 2)) + dualScreenTop;
	    var newWindow = window.open(url, "_blank", 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

	    // Puts focus on the newWindow
	    if (window.focus) {
	        newWindow.focus();
	    }

	    return newWindow;
	}

	$("#logIntoReddit").click(function(){
		var id = guid();
		var win = popup("https://www.reddit.com/api/v1/authorize?" + 
			"client_id=TElh_zpz1E-Yug&" +
			"response_type=code&" + 
			"state=" + id + "&" + 
			// "redirect_uri=http://chatterbox.rivison.com/oauth&" + 
			"redirect_uri=http://localhost:8888/redirect&" + 
			"duration=permanent&" +
			"scope=identity"
		, 'Log Into Reddit', 850, 400, 0, 0);	


		$.request("GET","/token?id=" + id).done(function(data){
			if(data.token){
				$.request.token = data.token;

				// localStorage.setItem("token",data.token);
				doneLogin();
				// $("#loggedIn").html($("#loggedIn").html() + "<br><br>Here's your reddit token: <b>" + data.token + "</b> <br>(host webpage shouldn't be able to get this token because this is an iframe and the same origin policy applies)<br><br>Loading Discussions...");
			}
		})
	});

	function doneLogin(){
		$("#logo").animate({
			 width:100
			,"margin-top":-15
		},500,function(){

		})

		if($("#notLoggedIn").is(":visible")){
			$("#notLoggedIn").fadeToggle("fast");
		}		
		setTimeout(function(){
			$("#loggedIn").fadeToggle("fast");
		},300);

		var source   = $("#comment-template").html();
		var template = Handlebars.compile(source);
		Handlebars.registerPartial( "comment", $( "#comment-template" ).html() );

		// [ Get Comments ]
		$.request("GET","/discusions?link=" + encodeURI("http://www.vox.com/world/2016/11/1/13487322/donald-trump-russia-agent-hack")).done(function(discusions){
			var comments = discusions[0].comments;

			$("#comments").empty();
			$.each(comments,function(i,comment){
				var html = template(comment);
				console.log(comment.content);
				$("#comments").append(html);
			})

			// $("#loggedIn").text(JSON.stringify(data));
		});
	}

	function guid(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}
})();
