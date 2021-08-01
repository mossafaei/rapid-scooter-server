<?php
	/*
	Request:
		{
			"PhoneNumber":"USER_PHONE_NUMBER"
			"FirstName":"USER_NAME"
			"LastName":"USER_FAMILY"
		}
	Response:
		{
			"Status":("Sucess" OR "Faild")
		}
	*/
	include '../CheckServer.php';
	CheckServer();
	header('Content-Type: application/json');
	$json = file_get_contents('php://input');
	$data = json_decode($json);
	$new_MToken = md5(uniqid($data->PhoneNumber,true));
	
	$servername = "localhost:3306";
	$username = "rapidsco";
	$password = "9Bg491Qdix";
	$dbname = "rapidsco_rapid";
		
	do {
		$conn = new mysqli($servername,$username,$password,$dbname);
	} while ($conn->connect_error);
	mysqli_set_charset($conn,"utf8");
	
	$sql = "SELECT PhoneNumber FROM UserDetail WHERE PhoneNumber=" . $data->PhoneNumber;
	do{
	    $result = $conn->query($sql);
	}while (!$result);
	
	if ($result->num_rows > 0){
	    echo json_encode(array("Status" => "Faild"));
	    $conn->close();
	    exit();
	}
	
	$sql = "INSERT INTO UserDetail(PhoneNumber,FirstName,LastName,Token) VALUES ('". $data->PhoneNumber ."','" . $data->FirstName . "','" . $data->LastName . "','" . $new_MToken . "')";
	do{
		$result = $conn->query($sql);
	}while (!$result);
	echo json_encode(array("Status" => "Sucess"));
	$conn->close();
?>