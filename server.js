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

app.listen(8080)


/*
////////////////MQTT Part
*/

aedes.authenticate = function (client, username, password, callback) {
    
    //if (username === 'test' && password.toString() === 'test') {
    //    callback(null, true)
    //    return
    //}

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
