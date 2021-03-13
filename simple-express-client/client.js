const axios = require('axios')
const fs = require('fs');
const https = require('https');

const httpsAgent = new https.Agent({ ca: fs.readFileSync('./security/certificates/ca-crt.pem') });
var authToken;

function writeToken(token) {
  fs.writeFile("token.txt", token, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully Written to File.");
    }    
  });
}

function readToken() {
  return new Promise((resolve, reject) => {
    fs.readFile("token.txt", function(err, buf) {    
      if (!err) {
        resolve(buf.toString());
      }      
      resolve(null);
    });  
  });
}

const loginRequestOptions = {
  hostname: 'auth-service',
  port: 3080,
  path: '/login',
  method: 'POST',  
  headers: {
    'Content-Type': 'application/json',    
    
  },
  ca: fs.readFileSync('./security/certificates/ca-crt.pem')
};

function loginAndGetBooks(username, password) {
  console.log('Client: logging in.');
  const loginData = JSON.stringify({
    username: username,
    password: password
  })
  const req = https.request(loginRequestOptions, (res) => {
    console.log(`statusCode: ${res.statusCode}`)
    console.log(`data: ${res}`)
    var str='';

    res.on('data',function(chunk){
        str+=chunk;
    });

    res.on('end',function(){
      token = JSON.parse(str).accessToken;
      console.log(token);
      writeToken(token);
      getBooks(token);
    });

    res.on('loginData', (d) => {
      process.stdout.write(d)
    });    
  });

  req.on('error', (error) => {
    console.log('Client: ERROR');
    console.log("Error: " + error);
  });

  req.write(loginData);
  req.end();
}
// function loginAndGetBooks(username, password) {
//   console.log('Client, logging in.')
//   axios.post('https://localhost:3080/login', {
//     username: username,
//     password: password
//   },
//   {
//     httpsAgent
//   })
//   .then((res) => {
//     console.log("Login successful");
//     writeToken(res.data.accessToken);
//     getBooks(res.data.accessToken);
//   })
//   .catch((error) => {
//     console.log('Client, loging error.')
//     console.error(error)
//   })  
// }


function getBooks(token) {
  console.log('Getting books with ' + token);
  return new Promise((resolve, reject) => {
    console.log('CALL https://localhost:4000/books')
    axios.get('https://localhost:4000/books', {      
      httpsAgent,
      headers: {
        authorization: token
      }
    }).then((res) => {
      console.log(res.data);
      resolve(res.data);
    }).catch((er) => {
      console.log('Error while retrieving books ');
      console.log(er);
      reject(er)
    });
  });
}

async function test() {
  authToken = await readToken();
  console.log("STORED AUTH TOKEN " + authToken);
  if (authToken != null && authToken != undefined) {
    console.log("I HAVE STORED TOKEN, CALLING BOOKS DIRECTLY");
    getBooks(authToken).then( (books) => {
      console.log('Success getting books');      
    }).catch((errorRetrievingBooks) => {
      console.log('trying to login instead');
      loginAndGetBooks('Anna', 'apwd');
    });
  } else {
    console.log("NO STORED TOKEN, LOGING IN");
    loginAndGetBooks('Anna', 'apwd');
  }
}

test();
