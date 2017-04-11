// Set up
var express  = require('express');
var app      = express();
var router = require('express').Router();                              // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var cors = require('cors');
var socket = require('socket.io'),
    http = require('http'),
    server = http.createServer(),
    socket = socket.listen(app.listen(process.env.PORT || 5000));


socket.on('connection', function(connection) {
  console.log('User Connected');
  connection.on('message', function(data){
    console.log("player join data",data)
    connection.join(data.page)
    socket.in(data.page).emit('message', data.player);
  });

  connection.on('start game', function(data){
    console.log("start game data",data)
    connection.join(data.page)
    socket.in(data.page).emit('start game', data.play, data.playerNum, data.otherPlayers);
  });

  connection.on('send bid', function(data){
    console.log("bid data",data)
    connection.join(data.page)
    socket.in(data.page).emit('send bid', data.bid, data.player);
  });

  connection.on('player rolled', function(data){
    console.log("player rolled",data)
    connection.join(data.page)
    socket.in(data.page).emit('player rolled', data.playerNum, data.game);
  });

  connection.on('players in game', function(data){
    console.log("players in game",data)
    connection.join(data.page)
    socket.in(data.page).emit('player rolled', data.array);
  });

  connection.on('you marked', function(data){
    console.log("you marked",data)
    connection.join(data.page)
    socket.in(data.page).emit('you marked', data.playerNum);
  });

  connection.on('new roll', function(data){
    console.log("new roll",data)
    connection.join(data.page)
    socket.in(data.page).emit('new roll', data.playerNum, data.youUp);
  });

  connection.on('out of game', function(data){
    console.log("out of game",data)
    connection.join(data.page)
    socket.in(data.page).emit('out of game', data.player);
  });

  connection.on('game update', function(data){
    console.log("game update",data)
    connection.join(data.page)
    socket.in(data.page).emit('game update', 1);
  });

  connection.on('main menu', function(data){
    console.log("main menu",data)
    connection.join(data.page)
    socket.in(data.page).emit('main menu');
  });

});




// Configuration
if (process.env.MONGO_URL){
  mongoose.connect(process.env.MONGO_URL);
}else{
  mongoose.connect('mongodb://austke:liars@ds147920.mlab.com:47920/liarsdice');
}

app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(cors());
app.use('/v1', router);


app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});

// Models
var Game = mongoose.model('Game', {
    players: [{name:String, playerNum:Number, marks:Number}],
    passphrase: String,
    diceRoll: [],
    totalDice:[],
    gamesize:Number
});

// Routes

    router.get('/', (req, res)=> {
        console.log("fetching games");
    });


    // create review and send back all reviews after creation
    router.post('/api/game', (req, res) =>{
      Game.create({
          players: [{name:req.body.player, playerNum:1, marks:0}],
          passphrase : req.body.phrase,
          diceRoll: [],
          totalDice:[],
          gamesize:0,
          done : false
      }, (err, game)=> {
          if (err)
              res.send(err);
          // get and return all the reviews after you create another
          Game.find((err, game)=> {
              if (err)
                  res.send(err)
              res.json(game);
          });
      });
});


router.put('/api/game/:phrase', (req, res)=> {
  Game.findOne({passphrase:req.params.phrase}, (err,game)=>{
    if(err) return next (err);
    if(!game) return res.send;
    if (game.diceRoll.length!==0&&game.totalDice.length){
      game.diceRoll =[];
      game.totalDice=[];
    }
    if(req.body.player&&game.players.length<4){
      game.players.push({name:req.body.player, playerNum:game.players.length+1, marks:0})
    }
    if (req.body.roll&&game.diceRoll.length<4){
      game.diceRoll.push(req.body.roll)
    }
    if(game.diceRoll.length===game.players.length){
      var totaldice = game.diceRoll
      var groupdice = [].concat.apply([],totaldice)
      game.totalDice.push(groupdice)
      console.log(game.totalDice);
    }
    game.save((err)=>{
      if(err) return  (err);
      return res.json(game);
    });
  })
});

router.get('/api/game/:phrase', (req, res)=> {
  Game.findOne({passphrase:req.params.phrase}, (err,game)=>{
    if(err) return next (err);
    if(!game) return res.json({passphrase:"not working"});
    return res.json(game);
  })
});

router.put('/api/game/:phrase/:playnum', (req, res)=> {
  Game.findOne({passphrase:req.params.phrase}, (err,game)=>{
    var playnum = req.params.playnum;
    for (var i =0; i<game.players.length; i++){
      console.log("playerNum",game.players[i].playerNum)
      if (game.players[i].playerNum === Number(playnum)){
        console.log(game.players[i])
        game.players[i].marks++;
      }
    }
    if(err) return next (err);
    if(!game) return res.send;
      game.save((err)=>{
      if(err) return next (err);
      return res.json(game);
      });
  });
});

router.delete('/api/game/:phrase/:playnum', (req, res)=> {
  Game.findOne({passphrase:req.params.phrase}, (err,game)=>{
      for (var i =0; i<game.players.length; i++){
        if (Number(req.params.playnum) ===game.players[i].playerNum){
          game.players.splice(i,1);
        }
      }
    if(err) return next (err);
    if(!game) return res.send;
    game.save((err)=>{
      if(err) return (err);
      return res.send();
    });
  });
});

router.put('/api/game/:phrase/players/:playersize', (req, res)=> {
  Game.findOne({passphrase:req.params.phrase}, (err,game)=>{
    var playersize = req.params.playersize;
      game.gamesize = playersize;
    if(err) return next (err);
    if(!game) return res.send;
    game.save((err)=>{
      if(err) return next (err);
      return res.json(game);
    });
  });
});

router.get('/api/game/:phrase/:playnum', (req, res)=> {
  Game.findOne({passphrase:req.params.phrase}, (err,game)=>{
    if(err) return next (err);
    if(!game) return res.json({passphrase:"not working"});
    console.log("game", game.players[req.params.playnum-1]);
    return res.json(game);
  });
});


// server.listen(5001);

// listen (start app with node server.js) ======================================
// app.listen(process.env.PORT || 5000);

console.log("App listening on port 5000");
