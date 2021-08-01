<?php
	/*
		Request:
		{
			"Duration" : "SCOOTER_DURATION_USAGE" 
		}
		
		Response:
		{
			"Price" : "SCOOTER_USAGE_PRICE"
		}
	*/
	include '../CheckServer.php';
	CheckServer();
	$PRICE_PER_SECOND = 400;
	header('Content-Type: application/json');
	$json = file_get_contents('php://input');
	$data = json_decode($json);
	echo json_encode(array("Price" => $PRICE_PER_SECOND * $data->Duration));
?>