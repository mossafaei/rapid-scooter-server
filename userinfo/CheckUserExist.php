<?php
    /*
        Request:
        {
            "PhoneNumber":"USER_PHONE_NUMBER"
        }

        Response:
        {
            "Status" : ("True" OR "False")
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
	$sql = 'SELECT PhoneNumber,Token FROM UserDetail WHERE PhoneNumber=' . $data->PhoneNumber;
	do{
		$result = $conn->query($sql);
	}while (!$result);
	if ($result->num_rows > 0)
		echo json_encode(array("Status"=>"True"));
	else
		echo json_encode(array("Status"=>"False"));
	$conn->close();
?>