<?php
//echo phpinfo();
//exit();
header('Content-Type: application/json');
$data_Price = array('ScooterID' => "A1111" , "PhoneNumber" => "0912");
$data_string_Price = json_encode($data_Price);
$ch = curl_init('http://127.0.0.1:8080/UnLock');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string_Price);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
'Content-Type: application/json',
'Content-Length: ' . strlen($data_string_Price)
));
$result = curl_exec($ch);
$jsonRes = json_decode($result);
echo $result;

?>
