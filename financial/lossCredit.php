<?php
  /*
        Request:
        {
            "PhoneNumber" : "USER_PHONE_NUMBER",
            "Credit" : "USER_CREDIT"

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
  $query = new MongoDB\Driver\Query(['PhoneNumber' => $data->PhoneNumber],['_id' => 0 , 'History' => 0]);
  
  $res = $manager->executeQuery('rapid.financial',$query);
  $fnd = $res->toArray();
  if (empty($fnd)){
     echo json_encode(array('Status' => 'Faild'));
     exit();
  }


  //Transaction REMEMBER

  $query = new MongoDB\Driver\Query(['PhoneNumber' => $data->PhoneNumber],['_id' => 0,'PhoneNumber' => 0 , 'History' => 0]);
  $res = $manager->executeQuery('rapid.financial',$query);
  $fnd = current($res->toArray());
    
  $Credit_mi = $fnd->Credit - $data->Credit;
    
    
    //TRANSACTION REMEMBER
    //$session = $m->startSession();
    //$session->startTransaction();
    //try{

  $bulk = new MongoDB\Driver\BulkWrite;
  $bulk->update(['PhoneNumber' => $data->PhoneNumber] , ['$push' => ['History' => ['Value' => '-' . strval($data->Credit),'Date'=>date("Y-m-d h:i:s")]]]);
  $bulk->update(['PhoneNumber' => $data->PhoneNumber] , ['$set' => ['Credit' => $Credit_mi ]]);
  $manager->executeBulkWrite('rapid.financial',$bulk);
  
  echo json_encode(array("Status"=>"Sucess"));
?>
