(function(){
	$.request.host = "http://localhost:8888/";

	function getVariables(){
		var vars = {};
		if(document.location.toString().indexOf('?') !== -1) {
		    var query = document.location
		                   .toString()
		                   // get the query string
		                   .replace(/^.*?\?/, '')
		                   // and remove any existing hash string (thanks, @vrijdenker)
		                   .replace(/#.*$/, '')
		                   .split('&');

		    for(var i=0, l=query.length; i<l; i++) {
		       var aux = decodeURIComponent(query[i]).split('=');
		       vars[aux[0]] = aux[1];
		    }
		}
		
		return vars;
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

	// [ Loading dots ]
	setInterval(function(){
		var text = $("#commentsMessage").text();
		if(text == "Loading..."){
			text = "Loading   ";
		}else if(text == "Loading   "){
			text = "Loading.  "
		}else if(text == "Loading.  "){
			text = "Loading.. ";
		}else if(text == "Loading.. "){
			text = "Loading...";
		}
		$("#commentsMessage").text(text);
	},500);

	var getVars = getVariables();
	$("#logIntoReddit").click(function(){
		var id = guid();
		var win = popup("https://www.reddit.com/api/v1/authorize?" + 
			"client_id=TElh_zpz1E-Yug&" +
			"response_type=code&" + 
			"state=" + id + "&" + 
			// "redirect_uri=http://chatterbox.rivison.com/oauth&" + 
			"redirect_uri=http://localhost:8888/redirect&" + 
			"duration=permanent&" +
			"scope=identity,submit"
		, 'Log Into Reddit', 850, 400, getVars["width"], getVars["height"]);	


		$.request("GET","/token?id=" + id).done(function(data){
			if(data.token){
				$.request.token = data.token;

				window.localStorage.setItem("token",JSON.stringify(data.token));
				doneLogin();
				// $("#loggedIn").html($("#loggedIn").html() + "<br><br>Here's your reddit token: <b>" + data.token + "</b> <br>(host webpage shouldn't be able to get this token because this is an iframe and the same origin policy applies)<br><br>Loading Discussions...");
			}
		})
	});

	var currentDiscussionId = null;

	// [ Post Comment ]
	$("#postButton").click(function(){
		if(currentDiscussionId){
			var content = $("#commentInput").val();
			$.request("POST","/discusions/" + currentDiscussionId + "/comments",{ "content":content }).done(function(){
				alert("success");
			})
		}else{
			alert("No discusion");
		}
		
	})

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
		$.request("GET","/discusions?link=" + encodeURI(getVars["link"])).done(function(discusions){
			var hasComments = true;
			var hasDiscussions = true;
			if(discusions.length == 0){
				hasComments = false;
				hasDiscussions = false;
			}else if(!discusions[0].comments){
				currentDiscussionId = discusions[0].id;
				hasComments = false;
			}else if(discusions[0].comments.length == 0){
				currentDiscussionId = discusions[0].id;
				hasComments = false;
			}

			if(hasComments){
				var comments = discusions[0].comments;
				currentDiscussionId = discusions[0].id;

				$("#comments").empty();
				$.each(comments,function(i,comment){
					var html = template(comment);
					console.log(comment.content);
					$("#comments").append(html);
				})
			}else{
				$("#commentsMessage").text("No Comments Yet");
			}



			// $("#loggedIn").text(JSON.stringify(data));
		});
	}

	function guid(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}


	// [ Try to get token ]
	try{
		$.request.token = JSON.parse(window.localStorage.getItem("token"));
	}catch(e){

	}

	if(!$.request.token){
		var iframe = $("#oauthIframe");
		$("#notLoggedIn").show();
	}else{
		doneLogin();
	}
})();
