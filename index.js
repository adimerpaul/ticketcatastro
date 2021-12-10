const MongoClient = require('mongodb').MongoClient

const express = require('express');
const bodyParser = require('body-parser');
const ObjectID = require('mongodb').ObjectID;
const app = express();
const http = require('http');
const server = http.createServer(app);
const moment= require('moment');

const { Server } = require("socket.io");
const io = new Server(server);

const port = 3000;
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
let db;
let collection;
MongoClient.connect('mongodb://localhost/catastro', { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err)
    console.log('Connected to Database')
    db = client.db('catastro')
    collection= db.collection('fichas')
})

// app.get('/', (req, res) => {
//     res.send("Hello world!")
// })
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/tele', (req, res) => {
    res.sendFile(__dirname + '/tele.html');
});
app.get('/atender', (req, res) => {
    res.sendFile(__dirname + '/atender.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
    socket.on('datos', (msg) => {
        io.emit('datos', msg);
    });
    socket.on('tele', (msg) => {
        io.emit('tele', msg);
    });
});

app.get('/usuario/:id', (req, res) => {
    // res.json(req.params.id)
    db.collection('usuarios').find({usuario:req.params.id}).toArray()
        .then(results => {
            res.json(results);
            // console.log(results)
        }).catch(error => console.error(error));
})

app.get('/ficha', (req, res) => {
    db.collection('fichas').find({
        fecha:moment().format('YYYY-MM-DD'),
    }).toArray()
        .then(results => {
            res.json(results);
        }).catch(error => console.error(error));
})
app.get('/fichaatendidos', (req, res) => {
    db.collection('fichas').find({
        fecha:moment().format('YYYY-MM-DD'),
        estado:'EN ESPERA'
    }).toArray()
        .then(results => {
            res.json(results);
        }).catch(error => console.error(error));
})

app.post('/ficha', (req, res) => {
    db.collection('fichas').find({
        distrito:req.body.d,
        fecha:moment().format('YYYY-MM-DD'),
    }).toArray()
        .then(results => {
            // res.json(results.length+1);
            let numero=results.length+1
            collection.insertOne({
                distrito:req.body.d,
                estado:"EN ESPERA",
                usuario:req.body.usuario,
                fecha:moment().format('YYYY-MM-DD'),
                hora:moment().format('H:mm:ss'),
                numero,
            }).then(result => {
                    db.collection('fichas').findOne({_id: new ObjectID(result.insertedId)})//.toArray()
                        .then(results => {
                            res.json(results);
                        }).catch(error => console.error(error));
                })
                .catch(error => console.error(error))
        }).catch(error => console.error(error));

    // console.log(req.body)
        // collection.insertOne({
        //     distrito:req.body.d,
        //     fecha:moment().format('YYYY-MM-DD'),
        //     hora:moment().format('H:mm:ss'),
        // }).then(result => {
        //         db.collection('fichas').findOne({_id: new ObjectID(result.insertedId)})//.toArray()
        //             .then(results => {
        //                 res.json(results);
        //             }).catch(error => console.error(error));
        //     })
        //     .catch(error => console.error(error))
})
app.put('/ficha/:id', (req, res) => {
    // res.json(req.body.d);
    db.collection('fichas').findOne({estado: 'EN ESPERA',distrito:req.body.d,fecha:moment().format('YYYY-MM-DD')})//.toArray()
        .then(results => {
            // res.json(results._id);
            // console.log(results)
            if (results!=null){
                collection.findOneAndUpdate(
                    { _id: new ObjectID(results._id) },
                    {
                        $set: {
                            estado: "ATENDIDO",
                            usuario: req.body.usuario
                        }
                    },
                    {
                        upsert: true
                    }
                ).then(result => { res.json(result.value) })
                    .catch(error => console.error(error))
            }else{
                res.json('-1')
            }


        }).catch(error => console.error(error));
    // collection.findOneAndUpdate(
    //     { _id: new ObjectID(req.params.id) },
    //     {
    //         $set: {
    //             name: req.body.name,
    //             price: req.body.price
    //         }
    //     },
    //     {
    //         upsert: true
    //     }
    // ).then(result => { res.json('Updated') })
    //     .catch(error => console.error(error))
});
app.delete('/ficha/:id', (req, res) => {
    collection.deleteOne(
        { _id: new ObjectID(req.params.id)}
    )
        .then(result => {
            res.json('Deleted')
        })
        .catch(error => console.error(error))
})
server.listen(port, function () {
    console.log('listening on '+port)
});