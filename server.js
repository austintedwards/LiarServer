// Set up
var express  = require('express');
var app      = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var cors = require('cors');

// Configuration
mongoose.connect('mongodb://austke:liars@ds147920.mlab.com:47920/liarsdice');

app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(cors());

app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});

// Models
var Game = mongoose.model('Game', {
    players: [{name:String}],
    passphrase: String,
    gameplay: []
});

// Routes

    // Get reviews
    app.get('/api/game', (req, res)=> {
        console.log("fetching games");
    });

    // create review and send back all reviews after creation
    app.post('/api/game', (req, res) =>{
      console.log(req.body)
      Game.create({
          players: [{name:req.body.player}],
          passphrase : req.body.phrase,
          gameplay : [],
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


app.put('/api/game/:phrase', (req, res)=> {
  Game.findOne({passphrase:req.params.phrase}, (err,game)=>{
    if(err) return next (err);
    if(!game) return res.send;
    if(game.players.length<4){
      game.players.push({name:req.body.player})
    }
    game.save((err)=>{
      if(err) return next (err);
      return res.send();
    });

  })


});

    // delete a review
    // app.delete('/api/game/:game_id', function(req, res) {
    //     Review.remove({
    //         _id : req.params.game_id
    //     }, function(err, review) {
    //
    //     });
    // });


// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");
