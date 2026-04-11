const express = require('express');
const cors = require('cors');
require('dotenv').config();

const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes')

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//routes
app.use('/api', publicRoutes)

app.use('/api/admin', adminRoutes)

//test route
app.get('/', (req, res) => {
    res.send('Backend Kelulusan API Running !');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server Sedang Running di http://localhost:${PORT}`);
});