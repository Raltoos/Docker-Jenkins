const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('User Service is running');
})

app.listen(3002, () => {
    console.log('User Service is listening on port 3002');
})

module.exports = app;