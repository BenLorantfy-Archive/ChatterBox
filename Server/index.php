<?php

// [ Allow CORS ]
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); 
}   
// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Headers: " . apache_request_headers()["Access-Control-Request-Headers"]);
}

// [ Library to avoid the syntax hell that is cURL ]
include("lib/Requests.php");
Requests::register_autoloader();

// [ Route Requests ]
include("lib/altorouter.php");
$router = new AltoRouter();

$router->map( 'GET', '/redirect', function() {

	// [ Input Validation ]
	if(!isset($_GET["state"])) return 1;
	if(!isset($_GET["code"])) return 2;

	$state = $_GET["state"];
	if(!preg_match("/^[A-Za-z\d\-]+$/", $state)){
		return 3;
	}

	$code = $_GET["code"];
	if(!preg_match("/^[A-Za-z\d\-_]+$/", $code)){
		return 4;
	}

	// [ Builds redirect url ]
	$host = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
	$redirect = $host . "/redirect";
	$endredirect = $host . "/redirectend?state=" . $state;

	// [ Gets token from code ]
	// https://github.com/reddit/reddit/wiki/OAuth2#retrieving-the-access-token
	$options = [
	    'auth' => ['TElh_zpz1E-Yug', '']
	];
	$data = [
		 "grant_type" => "authorization_code"
		,"code" => $code
		,"redirect_uri" => $redirect
	];

	$response = Requests::post('https://www.reddit.com/api/v1/access_token', [], $data, $options);
	$response = json_decode($response->body,true);
	$token = $response["refresh_token"];
	
	// [ Starts request to delete token after 60 seconds ]
	Requests::get($endredirect);

	// [ Save unclaimed token ]
	file_put_contents("unclaimed_tokens/" . $state, $token);

	// [ Tell browser window to close itself ]
	echo "<script>window.close();</script>";
});

$router->map( 'GET', '/redirectend', function(){
	if(!isset($_GET["state"])) return 1;

	$state = $_GET["state"];
	if(!preg_match("/^[A-Za-z\d\-]+$/", $state)){
		return 3;
	}

	// [ Closes the connection ]
	// (doesn't work when using file_get_contents for some odd reason, have to use curl )
	ignore_user_abort(true);
	set_time_limit(0);
	ob_start();
	echo "ok\n"; // send the response
	header('Connection: close');
	header('Content-Length: '.ob_get_length());
	ob_end_flush();
	ob_flush();
	flush();

	// [ From here on, the request has already ended but php can still execute code ]
	sleep(60);
	unlink("unclaimed_tokens/" . $state);
});

$router->map( 'GET', '/token', function() {

	// [ Input Validation ]
	if(!isset($_GET["id"])) return 1;

	$id = $_GET["id"];
	if(!preg_match("/^[A-Za-z\d\-]+$/", $id)){
		return 3;
	}

	// [ Waits a minute for user to press accept ]
	for($i = 0; $i < 60; $i++){
		$contents = file_get_contents("unclaimed_tokens/" . $id);
		if($contents){
			break;
		}

		// [ Sleep one second to prevent infinte loop ]
		sleep(1);
	}
	

	if($contents){

		// [ Delete token file because it is no longer unclaimed ]
		unlink("unclaimed_tokens/" . $id);

		// [ Return token ]
		return [
			"token" => $contents
		];
	}
});

function error($code,$message){
	return [
		 "error" => true
		,"code" => $code
		,"message" => $message
	];
}

function success(){
	return [
		"success" => true
	];
}

$router->map( 'GET', '/discusions', function() {
	$discusions = [];

	// $link = "http://www.vox.com/policy-and-politics/2016/11/1/13407844/republican-civil-war-trump-loses";
	if(!isset($_GET["link"])){
		return error("MissingLink","Link is missing");
	}

	$link = $_GET["link"];

	$url = "https://www.reddit.com/search.json?limit=1&sort=top&q=" . urlencode($link);


	$response = Requests::get($url);
	$response = json_decode($response->body,true);
	if(isset($response[0])){
		$posts = $response[0]["data"]["children"];
	}else{
		$posts = $response["data"]["children"];
	}
	

	// return $response;
	// return var_dump($response);

	// [ Gets all the reddit posts for this link ]
	foreach ($posts as $post) {
		$discusions[] = [
			 "id" => $post["data"]["id"]
			,"score" => $post["data"]["score"]
			,"author" => $post["data"]["author"]
		];
	}

	// return $discusions;

	// $url = "https://www.reddit.com/comments/5av043.json";
	$url = "https://www.reddit.com/comments/" . $discusions[0]["id"] . ".json";
	$response = Requests::get($url);
	
	

	$response = json_decode($response->body,true);
	// return $response;

	$comments = $response[1]["data"]["children"];
	


	// [ Adds comments to first discussion ]
	foreach ($comments as $uglyComment) {
		$comment = [
			 "id" => $uglyComment["data"]["id"]
			,"author" => $uglyComment["data"]["author"]
			,"content" => html_entity_decode($uglyComment["data"]["body_html"])
		];

		$comment = getReplies($comment,$uglyComment);

		$discusions[0]["comments"][] = $comment;
	}	

	return $discusions;
});

$router->map( 'POST', '/discusions/[a:postId]/comments', function($postId,$comment) {

	// [ Input Validation ]
	if(!isset($comment["content"])) return error("MissingComment","Comment is missing");
	if($comment["content"] == "") return error("EmptyComment","Comment is empty");

	$token = getToken();

	// [ Add authorization header ]
	$headers = [
    	'Authorization' => 'bearer ' . $token
    ];
	$options = [];

	// [ Comment data ]
	// t3_ means Link. see: https://www.reddit.com/dev/api/#fullnames
	$data = [
		 "api_type" => "json"
		,"thing_id" => 't3_' . $postId
		,"text" => $comment["content"]
	];

	// Requests using oauth have to be made to oauth.reddit.com
	// See: https://github.com/reddit/reddit/wiki/OAuth2-Quick-Start-Example#curl-example
	$response = Requests::post('https://oauth.reddit.com/api/comment', $headers, $data, $options);
	$response = json_decode($response->body,true);

	if(isset($response["json"]["errors"][0])){
		return error("RedditApiResponseError",$response["json"]["errors"][0]);
	}

	if(!isset($response["json"]["data"]["things"][0])){
		return $response;
		return error("RedditApiResponseErrorUnknown","Failed to create comment");
	}

	return success();
});

function getReplies($comment, $uglyComment){
	if(!isset($uglyComment["data"]["replies"]["data"]["children"])) return $comment;

	$replies = $uglyComment["data"]["replies"]["data"]["children"];
	foreach($replies as $uglyReply){
		$reply = [
			 "id" => $uglyReply["data"]["id"]
			,"author" => $uglyReply["data"]["author"]
			,"content" => html_entity_decode($uglyReply["data"]["body_html"])
		];		

		$reply = getReplies($reply,$uglyReply);

		$comment["replies"][] = $reply;
	}

	return $comment;
}

function getToken(){
	$token = null;
	$headers = apache_request_headers();

	foreach ($headers as $header => $value) {
		if($header == "X-Token"){
			$token = $value;
			break;
		}
	}

	if(!preg_match("/^[A-Za-z\d\-_]+$/", $token)){
		return null;
	}

	// [ Get's the access token by providing the refresh token ]
	$options = [
	    'auth' => ['TElh_zpz1E-Yug', '']
	];
	$data = [
		 "grant_type" => "refresh_token"
		,"refresh_token" => $token
	];
	$response = Requests::post('https://www.reddit.com/api/v1/access_token', [], $data, $options);
	$response = json_decode($response->body,true);
	$token = $response["access_token"];

	return $token;
}

// [ Process Request ]
$match = $router->match();
if( $match && is_callable( $match['target'] ) ) {
	$body = json_decode(file_get_contents('php://input'),true);

	$ret = call_user_func_array( $match['target'], array_merge($match['params'],[$body]) ); 
	if($ret !== NULL){
		echo json_encode($ret);
	}
} else {
	echo "404";
	// echo get_file_contents("https://http.cat/404");
	// header( $_SERVER["SERVER_PROTOCOL"] . ' 404 Not Found');
}