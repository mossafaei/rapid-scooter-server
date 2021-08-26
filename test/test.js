const mqtt = require('mqtt')
const axios = require('axios')

const CLIENT_ID = 'A1111'
const SERVER_URI = 'server-node'

const mqttClient = mqtt.connect(`mqtt://${SERVER_URI}`, {
    clientId : CLIENT_ID
})

mqttClient.on('connect', function() {
    console.log('Connected to server!')
    mqttClient.subscribe(`/scooter/admin/${CLIENT_ID}`, function(err) {
        if (!err)
            console.log(`Subscribed to /scooter/admin/${CLIENT_ID}`)
    })
})


mqttClient.on('message', function(topic, message) {
    console.log(message.toString())
})


//For finding errors
mqttClient.on('error', function(err) {
    console.log(err)
})
