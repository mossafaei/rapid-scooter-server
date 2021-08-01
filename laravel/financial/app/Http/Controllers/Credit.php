<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\History;

class Credit extends Controller
{
    //

    function PriceCalc($duration){
        $price_value = 400;
        return $duration*$price_value;
    }

    public function calculatePrice(Request $request){
        $json_content = $request->getContent();
        $json_content = json_decode($json_content);
        return response()->json(["Price" => $this->PriceCalc($json_content->Duration)], 200);
    }

    public function addCredit(Request $request){

        $history = new History;
        $json_content = $request->getContent();
        $json_content = json_decode($json_content);
        $history->PhoneNumber = $json_content->PhoneNumber;
        $history->Value = '+' . $json_content->Value;
        $history->save();
        return response()->json(["Status" => "OK"], 200);
    }

    public function lossCredit(Request $request){

        $history = new History;
        $json_content = $request->getContent();
        $json_content = json_decode($json_content);
        $history->PhoneNumber = $json_content->PhoneNumber;
        $history->Value = '-' . $json_content->Value;
        $history->save();
        return response()->json(["Status" => "OK"],200);
    }

    public function getCreditHistory(Request $request){
        $sum = 0;
        $json_content = $request->getContent();
        $json_content = json_decode($json_content);
        $histories = History::where('PhoneNumber',$json_content->PhoneNumber)->get();
        $jsonRes = ["Status" => "OK","Credit" => 0 , "History" => []];
        foreach ($histories as $history){
            $value_str = $history->Value;
            if ($value_str[0] == '+'){
                $sum += intval(substr($value_str,1));
            }else if ($value_str[0] == '-'){
                $sum -= intval(substr($value_str,1));
            }
            array_push($jsonRes["History"],["Value" => $history->Value , "Time" => $history->created_at]);
        }
        $jsonRes["Credit"] = $sum;
        return response()->json($jsonRes,200);
    }

}
