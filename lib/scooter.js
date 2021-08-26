function Scooter(aedesServer, redisClient){
    ///Assign MQTT server
    this.aedesServer = aedesServer

    ///Assign Redis client
    this.redisClient = redisClient
    
    this.topicPath = function() {
        return '/scooter/admin/'
    }
}

Scooter.prototype.lockScooter = function(scooterID) {
    this.redisClient.hmset(scooterID, 'Lock', 1)
        
    this.aedesServer.publish({ 
        topic: this.topicPath() + scooterID, 
        payload: 'lock=1' 
    })
}

Scooter.prototype.unLockScooter = function(scooterID) {
    this.redisClient.hmset(scooterID, 'Lock', 0)

    this.aedesServer.publish({
        topic: this.topicPath() + scooterID, 
        payload: 'lock=0' 
    })
}

Scooter.prototype.turnOnTheLight = function(scooterID) {
    this.redisClient.hmset(scooterID, 'Light', 1)
        
    this.aedesServer.publish({
        topic: this.topicPath() + scooterID, 
        payload: 'night=1'
    })
}

Scooter.prototype.turnOffTheLight = function(scooterID) {
    this.redisClient.hmset(scooterID, 'Light', 0)
        
    this.aedesServer.publish({
        topic: this.topicPath() + scooterID, 
        payload: 'night=0'
    })
}

exports.Scooter = Scooter 
