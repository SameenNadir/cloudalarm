const { exec } = require('child_process');

function runTerraformPlan(terraformDir) {
  return new Promise((resolve, reject) => {

    const command = `terraform plan -detailed-exitcode -no-color`;

    exec(command, { cwd: terraformDir }, (error, stdout, stderr) => {

      const exitCode = error ? error.code : 0;

      if (exitCode === 1) {
        return reject({
          success: false,
          exitCode: 1,
          error: stderr || stdout,
          message: 'Terraform encountered an error during the plan.',
        });
      }

      if (exitCode === 0) {
        return resolve({
          success: true,
          exitCode: 0,
          status: 'IN_SYNC',
          message: 'No drift detected. Infrastructure matches your Terraform code.',
          output: stdout,
        });
      }

      if (exitCode === 2) {
        return resolve({
          success: true,
          exitCode: 2,
          status: 'DRIFT_DETECTED',
          message: 'Drift detected! Your live infrastructure does not match your Terraform code.',
          output: stdout,
        });
      }

      return reject({
        success: false,
        exitCode,
        error: stderr,
        message: `Unexpected exit code: ${exitCode}`,
      });
    });
  });
}

module.exports = { runTerraformPlan };