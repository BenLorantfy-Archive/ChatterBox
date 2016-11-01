(function(){
	$.request.host = "http://localhost:8888/";

	var token = localStorage.getItem("token");

	if(!token){
		var iframe = $("#oauthIframe");
		$("#notLoggedIn").show();

	}else{
		doneLogin();
	}

	$("#logIntoReddit").click(function(){
		var id = guid();
		var win = window.open("https://www.reddit.com/api/v1/authorize?" + 
			"client_id=TElh_zpz1E-Yug&" +
			"response_type=code&" + 
			"state=" + id + "&" + 
			// "redirect_uri=http://chatterbox.rivison.com/oauth&" + 
			"redirect_uri=http://localhost:8888/redirect&" + 
			"duration=permanent&" +
			"scope=identity"
		, '_blank', 'location=yes,height=400,width=800,scrollbars=no,status=no');	



		$.request("GET","/token?id=" + id).done(function(data){
			if(data.token){
				$.request.token = data.token;

				// localStorage.setItem("token",data.token);
				doneLogin();
				$("#loggedIn").html($("#loggedIn").html() + "<br><br>Here's your reddit token: <b>" + data.token + "</b> <br>(host webpage shouldn't be able to get this token because this is an iframe and the same origin policy applies)");
			}
		})
	});

	function doneLogin(){
		if($("#notLoggedIn").is(":visible")){
			$("#notLoggedIn").fadeToggle("fast");
		}		
		setTimeout(function(){
			$("#loggedIn").fadeToggle("fast");
		},300);


		// [ Get Comments ]
		$.request("GET","/comments").done(function(data){
			console.log(data);
		});
	}

	function guid(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}
})();
