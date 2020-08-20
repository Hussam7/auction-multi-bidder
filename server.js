var express = require('express');
var app = express();
var httpd  = require('http').createServer(app);

var io = require('socket.io').listen(httpd);
app.use(express.static(__dirname+ '/public'))

var msgDatabase = [];
var bidDatabase = [0];
var firstBid = true;
var UsersNum = 0;
// when a client connects
io.sockets.on('connection', function (socket) {
    var isNewUser = true;
    socket.emit('loginHistory', { bidHistory: msgDatabase });
    socket.on('newUser', function(data){
        if(isNewUser === false) return; //Nothing to do; client already logged in

        isNewUser = false;
        console.log("user login")
        console.log(data)
        socket.username = data.username;
        UsersNum++;
        io.emit('user-joined', {username: socket.username, nuser: UsersNum});   
   });
    // listen to incoming bids
    socket.on('bid', function(content) {
        console.log(content)
        var username1 = socket.username
        var bid = content.amount
        if(firstBid){            
            firstBid = false;
            bidDatabase.push(parseInt(bid));
            msgDatabase.push([username1, bid]);
            io.emit('bid', {username: username1, amount: bid, isFirst: true});
        }else{
            if(bid > Math.max.apply(null, bidDatabase)){
                bidDatabase.push(parseInt(bid));
                msgDatabase.push([username1, bid]);
                io.emit('bid', {username: username1, amount: content.amount, isFirst: false});
            }else{
                socket.emit('notHighEnough',{});
            }
        }
        
         
    });

    socket.on('setTimer', function(data) {
        console.log('timer is on ')
        if(data.isFirst){          
            var timer2 = "2:01";
        var interval = setInterval(function () {
          var timer = timer2.split(":");
          //by parsing integer, I avoid all extra string processing
          var minutes = parseInt(timer[0], 10);
          var seconds = parseInt(timer[1], 10);
          --seconds;
          minutes = seconds < 0 ? --minutes : minutes;
          if (minutes < 0) return clearInterval(interval);
          seconds = seconds < 0 ? 59 : seconds;
          seconds = seconds < 10 ? "0" + seconds : seconds;
          io.emit('currentEndTime', {min1: minutes, sec1: seconds});         
          timer2 = minutes + ":" + seconds;
////////////
          if (minutes == 0 && seconds == 0) {
            io.emit("winner", { username:msgDatabase[msgDatabase.length-1][0], amount: msgDatabase[msgDatabase.length-1][1]});
            return clearInterval(interval);
          }
        }, 1000);            
        }
      });  

});
    //index
    app.get('/', (req, res) => {
        console.log('Hi!')
        
        res.redirect('index.html', {})
    })
    //end index
// create the server
httpd.listen(5555, function(){
    console.log('Auction server running 5555'); 
   });