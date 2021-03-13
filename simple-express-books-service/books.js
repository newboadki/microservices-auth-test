const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');

// SAMPLE CONTENT OF THIS SERVICE
const books = [
    {
        "author": "Chinua Achebe",
        "country": "Nigeria",
        "language": "English",
        "pages": 209,
        "title": "Things Fall Apart",
        "year": 1958
    },
    {
        "author": "Hans Christian Andersen",
        "country": "Denmark",
        "language": "Danish",
        "pages": 784,
        "title": "Fairy tales",
        "year": 1836
    },
    {
        "author": "Dante Alighieri",
        "country": "Italy",
        "language": "Italian",
        "pages": 928,
        "title": "The Divine Comedy",
        "year": 1315
    },
];

// CALL TO VALIDATE ENDPOINT IN A DIFFERENT SERVICE
// USES MUTUAL TSL COMUNICATION
function validateRequestOptions(token) {
    return {
        hostname: 'auth-service',
        port: 3000,
        path: '/validate',
        method: 'GET',
        key: fs.readFileSync('./security/certificates/books-service-key.pem'),
        cert: fs.readFileSync('./security/certificates/books-service-crt.pem'),
        ca: fs.readFileSync('./security/certificates/ca-crt.pem'),
        headers: {
            'authorization' : token
        }
    }
}

const authenticateJWT = (req, res, next) => {
    console.log('Books service: validating request');
    console.log(JSON.stringify(req.headers));
    https.get(validateRequestOptions(req.get('authorization')), (resp) => {
        
        console.log('Books service VALIDATE RESPONSE: ' + resp.statusCode);
        if (resp.statusCode == 200) {
            console.log("Service Book got a 200 response for the validate endpoint");
            next();
        } else {
            console.log("Service Book got a not 200 response for the validate endpoint");
            res.sendStatus(401);
        }
    }).on("error", (err) => {
        console.log('Books service: ERROR');
        console.log("Error: " + err.message);
        res.sendStatus(401);
    });
};

// CREATE THE APP WITH THE API
const app = express();
app.use(bodyParser.json());

app.get('/books', authenticateJWT,  (req, res) => {
    console.log('Books service: getting books');
    res.json(books);
});

// CREATE HTTPS SERVICE
const httpsServiceOptions = {
    key: fs.readFileSync('./security/certificates/books-service-key.pem'),
    cert: fs.readFileSync('./security/certificates/books-service-crt.pem'),
    ca: fs.readFileSync('./security/certificates/ca-crt.pem')
};
const booksServiceServer = https.createServer(httpsServiceOptions, app);
booksServiceServer.listen(4000, () => {
    console.log('Books service started on port 4000');
});