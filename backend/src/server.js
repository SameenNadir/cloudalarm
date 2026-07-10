const express = require('express');
const cors = require('cors');
require('dotenv').config();

const driftRoutes = require('./routes/drift');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CloudAlarm API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/drift', driftRoutes);
app.use('/api/projects', projectRoutes);

app.listen(PORT, () => {
  console.log(`✅ CloudAlarm backend running on http://localhost:${PORT}`);
  console.log(`   Health check  → http://localhost:${PORT}/health`);
  console.log(`   Drift scan    → POST http://localhost:${PORT}/api/drift/scan`);
  console.log(`   Projects      → GET/POST http://localhost:${PORT}/api/projects`);
});