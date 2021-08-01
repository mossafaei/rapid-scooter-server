<?php
   /*
        Request:
        {
            "PhoneNumber" : "USER_PHONE_NUMBER"
        }

        Response:
        {
            "Status" : "OK",
            "Trips" :[
                {
                    'ScooterID' : "SCOOTER_ID",
                    'STime' => "START_TIME",
                    'ETime' => "END_TIME",
                    'SLongitude' => "START_LONGITUDE",
                    'SLatitude' => "START_LATITUDE",
                    'ELongitude' => "END_LONGITUDE",
                    'ELatitude' => "END_LATITUDE",
                    'Duration' => "TRIP_DURATION",
                    'Price' => "TRIP_PRICE"
                },
                ...

            ]
        }

        OR

        {
           "Status" : "NotAvailable"
        }



   */

    include '../CheckServer.php';
    CheckServer();
   header('Content-Type: application/json');
   $json = file_get_contents('php://input');
   $data = json_decode($json);

   $manager = new MongoDB\Driver\Manager('mongodb://127.0.0.1:27017/');
   $query = new MongoDB\Driver\Query(['PhoneNumber' => $data->PhoneNumber],['_id' => 0 , 'PhoneNumber' => 0]);
    
   $res = $manager->executeQuery('rapid.userusage',$query);
   $fnd = current($res->toArray());
   
   if (!empty($fnd)){
        $fnd = array_merge(array("Status" => "OK"),array("Trips" => $fnd->Trips));
        echo json_encode($fnd);
   }else 
        echo json_encode(array("Status" => "NotAvailable"));

?>
