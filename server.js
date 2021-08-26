const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())

const fetch = require('node-fetch');

const redis = require('redis')
const redisClient = redis.createClient(6379, 'redis')

const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)

const Scooter = require('./lib/scooter').Scooter
const scooterCommands = new Scooter(aedes, redisClient)

const MQTTport = 1883
var serverRes = {}

function getFirstItemOfString(response) {
    const splittedItem = response.split('=')
    return splittedItem[1]
}

function getFullDate() {
    let date_ob = new Date();
    let date = ('0' + date_ob.getDate()).slice(-2);
    let month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    hours = (hours < 10 ? '0' : '') + hours
    let minutes = date_ob.getMinutes();
    minutes = (minutes < 10 ? '0' : '') + minutes
    let seconds = date_ob.getSeconds();
    seconds = (seconds < 10 ? '0' : '') + seconds
    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds
}

redisClient.on('connect', function () {
    console.log('Redis Connected');
})

/*

app.post('/testapi', function (req, res) {
    res.json({ "Status": "OK", "List": [{ "ScooterID": "A1111", "Available": "1", "Longitude": "0", "Latitude": "0", "Battery": "49", "Lock": "0", "Velocity": "0" }] });
})

*/

app.post('/TurnLightOn', function (request, response) {
    scooterCommands.turnOnTheLight(request.body['ScooterID'])
    response.json({ 'Status': 'Sucess' })
})

app.post('/TurnLightOff', function (request, response) {
    scooterCommands.turnOffTheLight(request.body['ScooterID'])
    response.json({ 'Status': 'Sucess' })
})

app.post('/Lock', function (request, response) {
    scooterCommands.lockScooter(request.body['ScooterID'])
    response.json({ 'Status': 'Sucess' })
})

app.post('/UnLock', function (request, response) {
    scooterCommands.unLockScooter(request.body['ScooterID'])
    response.json({ 'Status': 'Sucess' })
})

app.post('/StartTrip', function (req, res) {
    redisClient.sismember('Scooters', req.body['ScooterID'], function (err, object) {
        redisClient.hget(req.body['ScooterID'], 'Available', function (err, hgetobject) {
            if (object === 0 || hgetobject.toString() == '0')
                res.json({ 'Status': 'NotAvailable' })
            else {
                redisClient.hmget(req.body['ScooterID'], ['Longitude', 'Latitude', 'Available'], function (errget, objectget) {
                    redisClient.hmset(req.body['PhoneNumber'], 'ScooterID', req.body['ScooterID'], 'SLongitude', objectget[0], 'SLatitude', objectget[1], 'STime', getFullDate())
                    redisClient.hmset(req.body['ScooterID'], 'Available', 0)
                    UnLockScooter(req.body['ScooterID'])
                    res.json({ 'Status': 'Sucess' })
                })
            }
        })
    })
})

app.post('/EndTrip', function (req, res) {
    redisClient.sismember('Scooters', req.body['ScooterID'], function (err, object) {
        var checkavailable
        redisClient.hget(req.body["ScooterID"], 'Available', function (err, hgetobject) {
            if (object === 0 || hgetobject.toString() == '1')
                res.json({ "Status": "Error" })
            else {
                redisClient.hmget(req.body["ScooterID"], ['Longitude', 'Latitude'], function (errget, objectgetm) {
                    redisClient.hgetall(req.body["PhoneNumber"], function (errgetall, objectgetall) {
                        //Send Data To add(User/Scooter)Usage.php
                        var jsontousage = {
                            'PhoneNumber': req.body["PhoneNumber"],
                            'ScooterID': req.body["ScooterID"],
                            'STime': objectgetall['STime'],
                            'ETime': getFullDate(),
                            'SLongitude': objectgetall['SLongitude'],
                            'SLatitude': objectgetall['SLatitude'],
                            'ELongitude': objectgetm[0],
                            'ELatitude': objectgetm[1]
                        }
                        fetch('http://127.0.0.1/usage/addUserUsage.php', {
                            method: 'post',
                            body: JSON.stringify(jsontousage),
                            Headers: { 'Content-Type': 'application/json' }
                        }).then(UserUsageRes => UserUsageRes.json()).then(UserUsageResjson => console.log(UserUsageResjson))

                        fetch('http://127.0.0.1/usage/addScooterUsage.php', {
                            method: 'post',
                            body: JSON.stringify(jsontousage),
                            Headers: { 'Content-Type': 'application/json' }
                        }).then(ScooterUsageRes => ScooterUsageRes.json()).then(ScooterUsageResjson => console.log(ScooterUsageResjson))

                        redisClient.del(req.body["PhoneNumber"])
                        redisClient.hmset(req.body["ScooterID"], 'Available', 1)
                        LockScooter(req.body["ScooterID"])
                        res.json({ "Status": "Sucess" })
                    })
                })
            }
        })
    })
})


app.post('/ScooterDetail', function (req, res) {
    var ScooterDetailObject, detaillength
    var inde = 0
    redisClient.smembers('Scooters', function (err, object) {
        ScooterDetailObject = Array.from(object)
        if (ScooterDetailObject.length == 0) {
            res.json({ "Status": "OK", "List": [] })
            return
        }
        serverRes = {}
        serverRes["Status"] = "OK"
        serverRes["List"] = []
        detaillength = ScooterDetailObject.length
        for (var i = 0; i < ScooterDetailObject.length; i++) {
            redisClient.hgetall(ScooterDetailObject[i], function (error, getres) {
                inde++
                if (getres["Available"] == 1) {
                    serverRes["List"].push(getres)
                }

                if (detaillength === inde)
                    res.json(serverRes)
            })
        }
    })

})


app.post('/OneScooterDetail', function (req, res) {
    serverRes = {}
    serverRes["Status"] = "OK"
    serverRes["List"] = []
    redisClient.sismember('Scooters', req.body["ScooterID"], function (err, object) {
        redisClient.hgetall(req.body["ScooterID"], function (error, getres) {
            if (object === 1 && getres["Available"] == 1) {
                serverRes["List"].push(getres)
                res.json(serverRes)
            } else
                res.json({ "Status": "NotAvailable" })
        })
    })
})

app.post('/CheckScooterAvailable', function (req, res) {
    redisClient.sismember('Scooters', req.body["ScooterID"], function (err, object) {
        redisClient.hget(req.body["ScooterID"], 'Available', function (err, hgetobject) {
            if (object === 0 || hgetobject.toString() == '0')
                res.json({ "Status": "NotAvailable" })
            else
                res.json({ "Status": "Available" });
        })
    })
})

app.listen(8080)



/*
////////////////MQTT Part
*/


aedes.authenticate = function (client, username, password, callback) {
    
    //if (username === 'test' && password.toString() === 'test') {
    //    callback(null, true)
    //    return
    //}

    //dbo.collection("scooterdetail").findOne({token:password.toString(),id:username},function(err, result) {
    // if (result === null || result.length === 0 || err){
    //  callback(null,false)
    //}
    //})
    callback(null, true)
}

server.listen(MQTTport, function () {
    console.log('server started and listening on port ', MQTTport)
})

aedes.on('client', function (client) {
    console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
    redisClient.hmset(client.id, 'ScooterID', client.id, 'Available', 1)
    redisClient.sadd('Scooters', client.id)
    scooterCommands.lockScooter(client.id)
})

aedes.on('clientDisconnect', function (client) {
    console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
    redisClient.del(client.id)
    redisClient.srem('Scooters', client.id)
})

aedes.on('subscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
        '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', aedes.id)
})

aedes.on('publish', async function (packet, client) {
    console.log('client publish', packet.topic, 'and text:', packet.payload.toString())
    if (packet.topic === '/scooter/A1111') {
        let scooterResponse = packet.payload.toString().split('&')
        redisClient.hmset(
            'A1111', 
            'ScooterID', 'A1111', 
            'Longitude', parseFloat(getFirstItemOfString(scooterResponse[1])), 
            'Latitude', parseFloat(getFirstItemOfString(scooterResponse[2])), 
            'Battery', parseInt(getFirstItemOfString(scooterResponse[3])), 
            'Lock', parseInt(getFirstItemOfString(scooterResponse[4])), 
            'Velocity', parseInt(getFirstItemOfString(scooterResponse[5]))
        )
    }
})
