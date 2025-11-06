const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Order Service is running');
})

app.listen(3001, () => {
    console.log('Order Service is listening on port 3001');
})

module.exports = app;