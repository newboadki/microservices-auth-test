const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');

// CONSTANTS
const accessTokenSecret = 'basic-express-authentication-service-accesstokensecret';
const users = [
    {
        username: 'John',
        password: "jpwd",
        role: 'admin'
    },
    {
        username: 'Anna',
        password: "apwd",
        role: 'member'
    }
];

// CONFIGURE THE PRIVATE TOKEN VALIDATION APP
const app = express();
app.use(bodyParser.json());

app.get('/validate', (req, res) => {
    console.log('VALIDATE REACHED');
    const authHeader = req.headers.authorization;

    if (authHeader) {
        console.log('TOKEN RECEIVED: ' + authHeader);
        jwt.verify(authHeader, accessTokenSecret, (err, user) => {
            if (err) {
                console.log('JWT verification FAILED');
                console.log(err);
                return res.sendStatus(403);
            }

            console.log('JWT verification SUCCEEDED');
            res.sendStatus(200);
        });
    } else {
        console.log('REPLYING 401');
        res.sendStatus(401);
    }
});

// CONFIGURE THE PUBLIC LOGIN APP
const publicApp = express();
publicApp.use(bodyParser.json());

publicApp.post('/login', (req, res) => {
    // Read username and password from request body
    const { username, password } = req.body;

    console.log('LOGIN RECEIVED ' + req.body);
    console.log('USERNAME: ' + username);
    console.log('PASSWORD: ' + password);

    // Filter user from the users array by username and password
    const user = users.find(u => { return u.username === username && u.password === password });

    if (user) {
        // Generate an access token
        const accessToken = jwt.sign({ username: user.username,  role: user.role }, accessTokenSecret, { expiresIn: '1m' });

        console.log('login returning token ' + accessToken);
        res.json({
            accessToken
        });
    } else {
        console.log('login returning username or password incorrect');
        res.send('Username or password incorrect');
    }
});

// START THE SERVERS
const httpsValidationServerOptions = {
    key: fs.readFileSync('./security/certificates/auth-service-key.pem'),
    cert: fs.readFileSync('./security/certificates/auth-service-crt.pem'),
    ca: fs.readFileSync('./security/certificates/ca-crt.pem'),
    requestCert: true,
    rejectUnauthorized: true
};
const privateValidateServiceServer = https.createServer(httpsValidationServerOptions, app);

privateValidateServiceServer.listen(3000, () => {
    console.log('PRIVATE AUTH-SERVICE: HTTPS SERVER STARTED AT 3000');
});

const httpsLoginServerOptions = {
    key: fs.readFileSync('./security/certificates/auth-service-key.pem'),
    cert: fs.readFileSync('./security/certificates/auth-service-crt.pem'),
    ca: fs.readFileSync('./security/certificates/ca-crt.pem'),
};
const publicLoginServiceServer = https.createServer(httpsLoginServerOptions, publicApp);

publicLoginServiceServer.listen(3080, () => {
    console.log('PUBLIC AUTH-SERVICE: HTTPS SERVER STARTED AT 3080');
});