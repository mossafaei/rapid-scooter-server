<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('ipcheck')->get('/use',function (Request $request){
    return response()->json(["Status" => "OK"], 200);
});

/*Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});*/
