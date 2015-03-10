var express    = require( 'express' ), //Web framework
    bodyParser = require( 'body-parser' ),
    fs         = require( 'node-fs' ); //file system

var app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
  next();
});

app.get( '/api/item', function( request, response ) {
  responseObj = JSON.parse(fs.readFileSync('item.json'));
  response.status(responseObj.httpCode).json(responseObj.result);
});

app.get( '/api/enums', function( request, response ) {
  responseObj = JSON.parse(fs.readFileSync('enums.json'));
  response.status(200).json(responseObj.itemEnums);
});

var port = 8000;
app.listen( port, function() {
    console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});
