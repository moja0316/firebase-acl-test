const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

admin.initializeApp();

app.use(cookieParser());

app.use('/loginCsrf', (req, res, next) => {
    const value = (Math.random() * 100000000000000000).toString();
    const cookie = 'csrfToken';
    res.cookie(cookie, value);
    res.status(200).send();
});

app.post('/sessionLogin', (req, res) => {
    const idToken = req.body.idToken.toString();
    const csrfToken = req.body.csrfToken.toString();
    // Guard against CSRF attacks.
    const cookieCsrfToken = req.cookies.csrfToken;
    if (csrfToken !== cookieCsrfToken) {
        res.status(401).send('UNAUTHORIZED REQUEST!');
        return;
    }
    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // To only allow session cookie setting on recent sign-in, auth_time in ID token
    // can be checked to ensure user was recently signed in before creating a session cookie.
    admin.auth().createSessionCookie(idToken, { expiresIn })
        .then(sessionCookie => {
            // Set cookie policy for session cookie.
            const options = { maxAge: expiresIn, httpOnly: true, secure: true };
            res.cookie('__session', sessionCookie, options);
            return res.end(JSON.stringify({ status: 'success' }));
        }).catch((error) => {
            res.status(401).send('UNAUTHORIZED REQUEST!');
        });
});

app.use((req, res, next) => {
    // idTokenを取得
    console.log(req);
    const sessionCookie = req.cookies.__session || '';
    console.log('sessionCookie:' + sessionCookie);
    // Verify the session cookie. In this case an additional check is added to detect
    // if the user's Firebase session was revoked, user deleted/disabled, etc.
    admin.auth().verifySessionCookie(sessionCookie, true)
        .then((decodedClaims) => {
            functions.logger.info("This request is verifyed. decodedCliaims.email: " + decodedClaims.email);
            return next();
        })
        .catch((error) => {
            functions.logger.warn("This request is not verifyed. : " + error.message);
            res.redirect('/')
        });
});
app.use('/content', express.static(__dirname + '/content'));

exports.loadContents = functions.https.onRequest(app);
