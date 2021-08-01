<?php
    /*
        Request:
        {
            "ScooterID" : "SCOOTER_ID",
            "PhoneNumber" : "USER_PHONE_NUMBER",
            "STime" : "START_TIME(YY-MM-DD HH:MM:SS)",
            "ETime" : "END_TIME",
            "SLongitude" : "START_LONGITUDE",
            "SLatitude" : "START_LATITUDE",
            "ELongitude" : "END_LONGITUDE",
            "ELatitude" : "END_LATITUDE"
        }

        Response:
        {
            "Status" : ("Sucess" OR "Faild")
        }
    */
    include '../CheckServer.php';
    CheckServer();
    header('Content-Type: application/json');
    $json = file_get_contents('php://input');
    $data = json_decode($json);
    
    $manager = new MongoDB\Driver\Manager('mongodb://127.0.0.1:27017/');
    $query = new MongoDB\Driver\Query(["ScooterID" => $data->ScooterID],['_id' => 0, 'Trips' => 0]);

    $res = $manager->executeQuery('rapid.scooterusage',$query);
    $fnd = current($res->toArray());
    if (empty($fnd)){
       $doc = [
            'ScooterID' => $data->ScooterID,
            'Trips' => []
       ];
       $bulk = new MongoDB\Driver\BulkWrite;
       $bulk->insert($doc);
       $manager->executeBulkWrite('rapid.scooterusage',$bulk);
    }

    $start_time = strtotime($data->STime);
    $end_time = strtotime($data->ETime);
    $duration = abs($end_time - $start_time);

    $data_Price = array('Duration' => $duration);                                                                    
    $data_string_Price = json_encode($data_Price);                                                                              
    $ch = curl_init('http://127.0.0.1/financial/calculatePrice.php');                                                                 
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");                                                                     
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string_Price);                                                                  
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);                                                                      
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
    'Content-Type: application/json',                                                                                
    'Content-Length: ' . strlen($data_string_Price)                                                                       
    ));                                                                                                                  
    $result = curl_exec($ch);
    $jsonRes = json_decode($result);

    $bulk = new MongoDB\Driver\BulkWrite;
    $bulk->update(['ScooterID' => $data->ScooterID] , ['$push' => ['Trips' => [
        'PhoneNumber' => $data->PhoneNumber,
        'STime' => $data->STime,
        'ETime' => $data->ETime,
        'SLongitude' => $data->SLongitude,
        'SLatitude' => $data->SLatitude,
        'ELongitude' => $data->ELongitude,
        'ELatitude' => $data->ELatitude,
        'Duration' => $duration,
        'Price' => $jsonRes->Price
    ]]]);
    $manager->executeBulkWrite('rapid.scooterusage',$bulk);
    echo json_encode(array("Status" => "Sucess"));

?>