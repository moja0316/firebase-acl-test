const functions = require('firebase-functions');
const express = require('express');
const app = express();

app.use('/content', express.static(__dirname + '/content'))

exports.loadContents = functions.https.onRequest(app);
