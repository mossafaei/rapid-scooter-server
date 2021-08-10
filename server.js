const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const fetch = require('node-fetch');

const redis = require('redis')
var rclient = redis.createClient()

const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)

const port = 1883
var dbo;
var serverRes = {}
var Res;

function getS(respo){
  var a = respo.split("=")
  return a[1]
}

function getFullDate(){
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  hours = (hours < 10 ? "0" : "") + hours
  let minutes = date_ob.getMinutes();
  minutes = (minutes < 10 ? "0" : "") + minutes
  let seconds = date_ob.getSeconds();
  seconds = (seconds < 10 ? "0" : "") + seconds
  return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}

function LockScooter(ScooterID){
    aedes.publish({topic: '/scooter/admin/' + ScooterID,payload: 'lock=1'})
}

function UnLockScooter(ScooterID){
    aedes.publish({topic: '/scooter/admin/' + ScooterID,payload: 'lock=0'})
}

rclient.on('connect',function(){
    console.log('Redis Connected');
})

app.use(bodyParser.json())

app.post('/testapi',function(req,res){
  res.json({"Status":"OK","List":[{"ScooterID":"A1111","Available":"1","Longitude":"0","Latitude":"0","Battery":"49","Lock":"0","Velocity":"0"}]});  
})

app.post('/TurnLightOn',function(req,res){
    aedes.publish({topic:"/scooter/admin/" + req.body["ScooterID"] ,payload:"night=1"})
    rclient.hmset(req.body["ScooterID"], 'Light' , 1)
    res.json({"Status" : "Sucess"})
})

app.post('/TurnLightOff',function(req,res){
      aedes.publish({topic:"/scooter/admin/" + req.body["ScooterID"],payload:"night=0"})
       rclient.hmset(req.body["ScooterID"], 'Light' , 0)
      res.json({"Status" : "Sucess"})
})

app.post('/Lock',function(req,res){
    LockScooter(req.body["ScooterID"])
    rclient.hmset(req.body["ScooterID"], 'Lock' , 1)
    res.json({"Status" : "Sucess"})
})

app.post('/UnLock',function(req,res){
    UnLockScooter(req.body["ScooterID"])
    rclient.hmset(req.body["ScooterID"], 'Lock' , 0)
    res.json({"Status" : "Sucess"})
})

app.post('/StartTrip',function(req,res){
    rclient.sismember('Scooters',req.body["ScooterID"],function(err,object){
      rclient.hget(req.body["ScooterID"],'Available',function(err,hgetobject){
        if (object === 0 || hgetobject.toString() == '0')
            res.json({"Status":"NotAvailable"})
        else{
            rclient.hmget(req.body["ScooterID"],['Longitude','Latitude','Available'],function(errget,objectget){
              rclient.hmset(req.body["PhoneNumber"],'ScooterID',req.body["ScooterID"],'SLongitude',objectget[0],'SLatitude',objectget[1],'STime',getFullDate())
              rclient.hmset(req.body["ScooterID"] , 'Available' , 0)
              UnLockScooter(req.body["ScooterID"])
              res.json({"Status":"Sucess"})
            })
        }
      })
    })
})

app.post('/EndTrip',function(req,res){
    rclient.sismember('Scooters',req.body["ScooterID"],function(err,object){
      var checkavailable
      rclient.hget(req.body["ScooterID"],'Available',function(err,hgetobject){
        if (object === 0 || hgetobject.toString() == '1')
            res.json({"Status":"Error"})
        else{
            rclient.hmget(req.body["ScooterID"],['Longitude','Latitude'],function(errget,objectgetm){
              rclient.hgetall(req.body["PhoneNumber"],function(errgetall,objectgetall){
                //Send Data To add(User/Scooter)Usage.php
                var jsontousage = {
                  'PhoneNumber':req.body["PhoneNumber"],
                  'ScooterID':req.body["ScooterID"],
                  'STime':objectgetall['STime'],
                  'ETime':getFullDate(),
                  'SLongitude' : objectgetall['SLongitude'],
                  'SLatitude' : objectgetall['SLatitude'],
                  'ELongitude' : objectgetm[0],
                  'ELatitude' : objectgetm[1]
                }
                fetch('http://127.0.0.1/usage/addUserUsage.php',{
                    method : 'post',
                    body : JSON.stringify(jsontousage),
                    Headers : {'Content-Type' : 'application/json'}
                }).then(UserUsageRes => UserUsageRes.json()).then(UserUsageResjson => console.log(UserUsageResjson))

                fetch('http://127.0.0.1/usage/addScooterUsage.php',{
                  method : 'post',
                  body : JSON.stringify(jsontousage),
                  Headers : {'Content-Type' : 'application/json'}
              }).then(ScooterUsageRes => ScooterUsageRes.json()).then(ScooterUsageResjson => console.log(ScooterUsageResjson))

                rclient.del(req.body["PhoneNumber"])
                rclient.hmset(req.body["ScooterID"] , 'Available' , 1)
                LockScooter(req.body["ScooterID"])
                res.json({"Status":"Sucess"})
              })
            })
        }
      })
    })
})
app.post('/ScooterDetail',function(req,res){
    var ScooterDetailObject,detaillength
    var inde = 0
    rclient.smembers('Scooters',function(err,object){
        ScooterDetailObject = Array.from(object)
        if (ScooterDetailObject.length == 0){
            res.json({"Status" : "OK" , "List" : []})
            return
        }
        serverRes={}
        serverRes["Status"] = "OK"
        serverRes["List"] = []
        detaillength = ScooterDetailObject.length
        for (var i=0;i<ScooterDetailObject.length;i++){
            rclient.hgetall(ScooterDetailObject[i],function(error,getres){
                inde++
                if (getres["Available"] == 1){
                  serverRes["List"].push(getres)
                }

                if (detaillength === inde)
                  res.json(serverRes)
            })
        }
    })

})


app.post('/OneScooterDetail',function(req,res){
    serverRes={}
    serverRes["Status"] = "OK"
    serverRes["List"] = []
    rclient.sismember('Scooters',req.body["ScooterID"],function(err,object){
        rclient.hgetall(req.body["ScooterID"],function(error,getres){
        if (object === 1 && getres["Available"] == 1){
            serverRes["List"].push(getres)
            res.json(serverRes)
         }else
            res.json({"Status":"NotAvailable"})
    })
  })
})

app.post('/CheckScooterAvailable',function(req,res){
    rclient.sismember('Scooters',req.body["ScooterID"],function(err,object){
      rclient.hget(req.body["ScooterID"],'Available',function(err,hgetobject){
        if (object === 0 || hgetobject.toString() == '0')
            res.json({"Status":"NotAvailable"})
        else
            res.json({"Status":"Available"});
      })
    })
})

app.listen(8080)

aedes.authenticate = function (client,username,password,callback) {
  if (typeof username === 'undefined' ||typeof password === 'undefined'){
     callback(null,false)
     return
  }
  if (username === 'test' && password.toString() === 'test'){
     callback(null,true)
     return
  }

  //dbo.collection("scooterdetail").findOne({token:password.toString(),id:username},function(err, result) {
    // if (result === null || result.length === 0 || err){
      //  callback(null,false)
     //}
  //})
  callback(null,true)
}

server.listen(port, function () {
  console.log('server started and listening on port ', port)
})

aedes.on('client', function (client) {
    console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
    rclient.hmset(client.id,'ScooterID',client.id , 'Available' , 1)
    rclient.sadd('Scooters',client.id)
    LockScooter(client.id);
})

aedes.on('clientDisconnect', function (client) {
  console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
  //rclient.hmset(client.id , 'Available' , 0)
  rclient.del(client.id)
  rclient.srem('Scooters',client.id)
})

aedes.on('subscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
            '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', aedes.id)
    //aedes.publish({topic: '/scooter/admin/A1111',payload: 'UnLock'})
})

aedes.on('publish',async function (packet,client) {
    console.log('client publish',packet.topic,'and text:',packet.payload.toString())
    if (packet.topic == '/scooter/A1111'){
       Res = packet.payload.toString().split("&")
       rclient.hmset('A1111','ScooterID','A1111','Longitude',parseFloat(getS(Res[1])) , 'Latitude',parseFloat(getS(Res[2])),'Battery',parseInt(getS(Res[3])),'Lock' , parseInt(getS(Res[4])), 'Velocity' , parseInt(getS(Res[5])))
    }
})
