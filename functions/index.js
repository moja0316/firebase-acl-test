const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();

app.use((req, res, next) => {
    // idTokenを取得
    const idToken = req.query.token;
    functions.logger.debug("Token is :" + idToken);
    if (idToken === undefined) {
        return res.status(401).send("error: No credentials sent!");
    }
    // idTokenの正当性を検証する
    // idToken comes from the client app
    admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            functions.logger.info("This request is verifyed. idToken.uid: " + decodedToken.uid);
            return next();
        })
        .catch((error) => {
            functions.logger.warn("This request is not verifyed. : " + error.message);
            res.sendStatus(401).send(error.message);
        });
});
app.use('/content', express.static(__dirname + '/content'));

exports.loadContents = functions.https.onRequest(app);
