require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const organisationRoutes = require('./routes/organisationRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.use('/organisations', organisationRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Pitlane Mini API' });
});

const PORT = process.env.PORT || 4000;

async function start() {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    });
}

start();