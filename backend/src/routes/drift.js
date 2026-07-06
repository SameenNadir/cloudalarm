const express = require('express');
const { runTerraformPlan } = require('../services/terraformEngine');
const { sendDriftAlert } = require('../services/alertService');
const supabase = require('../services/supabaseClient');

const router = express.Router();

router.post('/scan', async (req, res) => {
  const { terraformDir, userId, userEmail } = req.body;

  if (!terraformDir) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: terraformDir',
    });
  }

  console.log(`🔍 Starting drift scan on: ${terraformDir}`);

  try {
    const result = await runTerraformPlan(terraformDir);
    const scannedAt = new Date().toISOString();

    // Save to database
    const { data, error } = await supabase
      .from('scans')
      .insert([{
        user_id: userId || null,
        terraform_dir: terraformDir,
        status: result.status,
        exit_code: result.exitCode,
        message: result.message,
        output: result.output,
        scanned_at: scannedAt,
      }])
      .select();

    if (error) {
      console.error('❌ Failed to save scan:', error.message);
    } else {
      console.log('💾 Scan saved:', data[0].id);
    }

    // Send email alert if drift detected
    if (result.status === 'DRIFT_DETECTED' && userEmail) {
      await sendDriftAlert({
        toEmail: userEmail,
        terraformDir,
        scannedAt,
      });
    }

    return res.status(200).json({
      success: true,
      terraformDir,
      ...result,
      scanId: data ? data[0].id : null,
      scannedAt,
    });

  } catch (err) {
    console.error(`❌ Scan failed:`, err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Scan failed',
      error: err.error || 'Unknown error',
    });
  }
});

router.get('/scans', async (req, res) => {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .order('scanned_at', { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  return res.status(200).json({ success: true, scans: data });
});

module.exports = router;