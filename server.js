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
    socket = socket.listen(server);

socket.on('connection', function(connection) {
  console.log('User Connected');
  connection.on('message', function(data){
    console.log("data",data)
    connection.join(data.page)
    socket.in(data.page).emit('message', data.player);
  });

  connection.on('start game', function(data){
    console.log("data",data)
    connection.join(data.page)
    socket.in(data.page).emit('start game', data.play);
  });

  connection.on('send bid', function(data){
    console.log("data",data)
    connection.join(data.page)
    socket.in(data.page).emit('send bid', data.bid);
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
    players: [{name:String, playerNum:Number}],
    passphrase: String,
    diceRoll: [],
    totalDice:[]
});

// Routes

    router.get('/', (req, res)=> {
        console.log("fetching games");
    });


    // create review and send back all reviews after creation
    router.post('/api/game', (req, res) =>{
      Game.create({
          players: [{name:req.body.player, playerNum:1}],
          passphrase : req.body.phrase,
          diceRoll: [],
          totalDice:[],
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
    if(req.body.player&&game.players.length<4){
      game.players.push({name:req.body.player, playerNum:game.players.length+1})
    }
    if (req.body.roll&&game.diceRoll.length<4){
      game.diceRoll.push(req.body.roll)
    }
    if(game.diceRoll.length===game.players.length){
      var totaldice = game.diceRoll
      var groupdice = [].concat.apply([],totaldice)
      game.totalDice.push(groupdice)
    }
    game.save((err)=>{
      if(err) return next (err);
      return res.send();
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





server.listen(process.env.PORT || 5001);

// listen (start app with node server.js) ======================================
app.listen(process.env.PORT || 5000);
console.log("App listening on port 5001");
