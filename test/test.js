const mqtt = require('mqtt')
const axios = require('axios')

const CLIENT_ID = 'A1111'
const SERVER_URI = 'server-node'

let mqttClient

const subscribeMqttPromise = new Promise((resolve, reject) => {
   
    if (typeof mqttClient == 'undefined')
        reject('mqttClient not defined')

    mqttClient.subscribe(`/scooter/admin/${CLIENT_ID}`, function(err) {
        if (!err)
            resolve('Subscribed')
        else
            reject('Cannot subscribe')
    })
})



beforeEach( async () => {
    
    await new Promise((resolve, reject) => {

        mqttClient = mqtt.connect(`mqtt://${SERVER_URI}`, {
            clientId : CLIENT_ID
        })

        mqttClient.on('connect', function() {
            resolve()
        })
    }) 

})


test('Testing Lock Scooter', () => {

    return subscribeMqttPromise.then(res => {
        
        return new Promise((resolve, reject) => {
            mqttClient.publish(`/scooter/${CLIENT_ID}`, 
                'id=A1111&longtiude=12&latitude=12&battery=50&lock=0&velocity=10', 
                function(err) {

                if (!err)
                    resolve('The message has been sent')
                else
                    reject('Error in sending the message')

            })   
        })

    }).then(res => { 
        return axios.post(`http://${SERVER_URI}/Lock`, {
            ScooterID : 'A1111' 
        })
    }).then(response => {
        
        resObj = JSON.parse(response)
        expect(resObj['Status']).toEqual('Sucess')

    }).catch(rej => {
        throw new Error(rej)
    })

})

