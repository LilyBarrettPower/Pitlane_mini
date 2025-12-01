require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');

console.log("uploading auth routes");
const authRoutes = require('./routes/authRoutes');

console.log("Uploading org routes");
const organisationRoutes = require('./routes/organisationRoutes');

console.log("Uploading vehicle routes");
const vehicleRoutes = require('./routes/vehicleRoutes');

console.log("Uploading driver routes");
const driverRoutes = require('./routes/driverRoutes');

console.log("Uploading vehicleDriver routes");
const vehicleDriverRoutes = require('./routes/vehicleDriverRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.use('/organisations', organisationRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/drivers', driverRoutes);
app.use('/vehicle-drivers', vehicleDriverRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Pitlane Mini API' });
});

const PORT = process.env.PORT || 4000;

async function start() {
    console.log("About to connect MongoDB");
    await connectDB(process.env.MONGO_URI);
    console.log("Connected to mongo, about to start server");
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    });
}

start();