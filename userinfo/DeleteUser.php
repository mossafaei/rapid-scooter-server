<?php
	/*
		Request:
			{
				"PhoneNumber":"USER_PHONE_NUMBER"
			}
		Request:
			{
				"Status" ("Sucess" OR "Faild")
			}
	*/
	include '../CheckServer.php';
	CheckServer();
	header('Content-Type: application/json');
	$json = file_get_contents('php://input');
	$data = json_decode($json);
	
	$servername = "localhost:3306";
	$username = "rapidsco";
	$password = "9Bg491Qdix";
	$dbname = "rapidsco_rapid";
	
	do {
		$conn = new mysqli($servername,$username,$password,$dbname);
	} while ($conn->connect_error);
	
	$sql = "DELETE FROM UserDetail WHERE PhoneNumber=" . $data->PhoneNumber;
	do {
		$result = $conn->query($sql);
	} while (!$result);
	echo json_encode(array("Status" => "Sucess"));
	$conn->close();
?>