<?php
   /*
        Request:
        {
            "PhoneNumber" : "USER_PHONE_NUMBER"
        }

        Response:
        {
            "Status" : "OK"
            "Credit" : "USER_CREDIT",
            "History" :[
                {
                    Value:"CREDIT_VARIATION",
                    Date:"VARIATION_DATE"
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
    
   $res = $manager->executeQuery('rapid.financial',$query);
   $fnd = current($res->toArray());
   
   if (!empty($fnd)){
        $fnd = array_merge(array("Status" => "OK"),array("Credit" => $fnd->Credit),array("History" => $fnd->History));
        echo json_encode($fnd);
   }else 
        echo json_encode(array("Status" => "NotAvailable"));

?>
