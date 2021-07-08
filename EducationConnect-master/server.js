require('dotenv').config()
var express = require("express")
var bodyParser = require("body-parser")
const hbs = require('hbs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const mongoose = require('mongoose');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const expressSession = require('express-session');
//var SpotifyWebApi = reqe('spotify-web-api-node');
const InitiateMongoServer = require("./config/db");


var app = express()
var server = require("http").Server(app)
var io = require("socket.io")(server)


app.use(methodOverride('_method'));

// PORT
const PORT = process.env.PORT || 3002;
// const CPORT = process.env.PORT || 3002;
const user = require("./routes/handleUserSignup");


const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require('peer')
const peer = ExpressPeerServer(server, {
    debug: true
});
app.use('/peerjs', peer);

app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: false }))

app.use("/", express.static(path.join(__dirname, '/public')));
hbs.registerPartials(__dirname + '/views/partials/');
app.use(expressSession({ secret: 'session_secret', saveUninitialized: false, resave: false }));


app.use("/newuser", express.static('public'));
app.use("/newuser", express.static('views/images'));
app.use("/newuser", user);

// app.get("/signup", (req, res) => {
//     res.render("signup");
// });
/**
 * Router Middleware
 * Router - /user/*
 * Method - *
 */



app.set('view engine', 'hbs')

var messages = [
    { name: "Bushra", message: "hello" },
    { name: "Bush", message: "hii" }
]

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
})

app.post('/messages', (req, res) => {
    var message = new Message(req.body)
    message.save((err) => {
        if (err)
            sendStatus(500)


        io.emit('message', req.body)
        res.sendStatus(200)
    })

})

app.get('/newuser/chat', (req, res) => {
    res.render('index', { user: req.session.user });
})

app.get('/', (req, res) => {
    res.render('home');
})



// Mongo URI
const mongoURI = 'mongodb+srv://admin:admin@cluster0.xqqoi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
    // Init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

var Message = mongoose.model('Message', {
    name: String,
    message: String
})


app.post('/messages', (req, res) => {
    messages.push(req.body)
    io.emit('message', req.body)
    res.sendStatus(200)
})


app.get('/newuser/index2', (req, res) => {
    console.log("reached");
    res.redirect(`/${uuidv4()}`);
})

app.get('/:room', (req, res) => {
    res.render('index2', { RoomId: req.params.room });
});


io.on("connection", (socket) => {
    socket.on('newUser', (id, room) => {
        socket.join(room);
        socket.to(room).emit('userJoined', id);
        socket.on('disconnect', () => {
            io.to(room).emit('userDisconnect', id);
        });
    });
});



(async function runServer() {
    // Initiate Mongo Server
    InitiateMongoServer();

    //connecting to the node server
    // await app.listen(PORT);
    server.listen(PORT, () => {
        console.log("Server running on port : " + PORT);
    });
    // console.log(`Server Started at PORT ${PORT}`);
})();