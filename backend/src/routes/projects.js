const express = require('express');
const supabase = require('../services/supabaseClient');

const router = express.Router();

// GET all projects
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(200).json({ success: true, projects: data });
});

// POST create a new project
router.post('/', async (req, res) => {
  const { name, terraformDir, userId } = req.body;

  if (!name || !terraformDir) {
    return res.status(400).json({ success: false, message: 'Missing name or terraformDir' });
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, terraform_dir: terraformDir, user_id: userId || null }])
    .select();

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(200).json({ success: true, project: data[0] });
});

// DELETE a project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(200).json({ success: true });
});

module.exports = router;