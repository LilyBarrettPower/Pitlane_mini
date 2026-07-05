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

console.log("Uploading event routes");
const eventRoutes = require('./routes/eventRoutes');

console.log("Uploading vehicle event routes");
const eventVehicleRoutes = require('./routes/eventVehicleRoutes');

console.log("Uploading track routes");
const trackRoutes = require('./routes/trackRoutes');

console.log("Uploading issue routes");
const issueRoutes = require('./routes/issueRoutes');

console.log("Uploading tyre routes");
const tyreRoutes = require('./routes/tyreRoutes');

console.log("Uploading tyre run routes");
const tyreRunRoutes = require('./routes/tyreRunRoutes');

console.log("Uploading run routes");
const runRoutes = require('./routes/runRoutes');

console.log("Uploading setup routes");
const setUpRoutes = require('./routes/setUpRoutes');

console.log("Uploading runsetup routes");
const runSetUpRoutes = require('./routes/runSetUpRoutes');

console.log("Uploading checklist base template routes");
const checklistBaseTemplateRoutes = require('./routes/checklistBaseTemplateRoutes');

console.log("Uploading checklist template routes");
const checklistTemplateRoutes = require('./routes/checklistTemplateRoutes');

console.log("Uploading checklist instance routes");
const checklistInstanceRoutes = require('./routes/checklistInstanceRoutes');

console.log("Uploading lap times routes");
const lapTimeRoutes = require('./routes/lapTimeRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.use('/organisations', organisationRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/drivers', driverRoutes);
app.use('/vehicle-drivers', vehicleDriverRoutes);
app.use('/events', eventRoutes);
app.use('/event-vehicles', eventVehicleRoutes);
app.use('/tracks', trackRoutes)
app.use('/issues', issueRoutes);
app.use('/tyres', tyreRoutes);
app.use('/tyre-runs', tyreRunRoutes);
app.use('/runs', runRoutes);
app.use('/setups', setUpRoutes);
app.use('/run-setups', runSetUpRoutes);
app.use('/checklist-base-templates', checklistBaseTemplateRoutes);
app.use('/checklist-templates', checklistTemplateRoutes);
app.use('/checklist-instance', checklistInstanceRoutes);
app.use('/lap-times', lapTimeRoutes);

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