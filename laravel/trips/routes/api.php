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

/*Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});*/

Route::middleware('ipcheck')->post('/StartTrip','TripController@StartTrip');
Route::middleware('ipcheck')->post('/EndTrip','TripController@EndTrip');
Route::middleware('ipcheck')->post('/getScooterDetail','TripController@getScooterDetail');
Route::middleware('ipcheck')->post('/CheckScooterAvailable','TripController@CheckScooterAvailable');