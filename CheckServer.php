<?php
	function CheckServer() {
		$ip = $_SERVER['REMOTE_ADDR'];
		if ($ip != '127.0.0.1'){
			header("HTTP/1.0 404 Not Found");
			echo "404 Not Found";
			exit();
		}
	}
?>