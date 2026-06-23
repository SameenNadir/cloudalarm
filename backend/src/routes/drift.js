const express = require('express');
const { runTerraformPlan } = require('../services/terraformEngine');
const supabase = require('../services/supabaseClient');

const router = express.Router();

router.post('/scan', async (req, res) => {
  const { terraformDir, userId } = req.body;

  if (!terraformDir) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: terraformDir',
    });
  }

  console.log(`🔍 Starting drift scan on: ${terraformDir}`);

  try {
    // Step 1: Run terraform plan
    const result = await runTerraformPlan(terraformDir);

    // Step 2: Save the result to Supabase
    const { data, error } = await supabase
      .from('scans')
      .insert([{
        user_id: userId || null,
        terraform_dir: terraformDir,
        status: result.status,
        exit_code: result.exitCode,
        message: result.message,
        output: result.output,
        scanned_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error('❌ Failed to save scan to database:', error.message);
    } else {
      console.log('💾 Scan saved to database:', data[0].id);
    }

    // Step 3: Return result to frontend
    console.log(`✅ Scan complete — Status: ${result.status}`);
    return res.status(200).json({
      success: true,
      terraformDir,
      ...result,
      scanId: data ? data[0].id : null,
      scannedAt: new Date().toISOString(),
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

// GET /api/drift/scans — fetch all past scans
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