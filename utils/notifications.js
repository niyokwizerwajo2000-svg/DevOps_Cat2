/**
 * Notification service for test results
 * Supports Slack, email, and generic webhooks
 */

const https = require('https');

class NotificationService {
  /**
   * Send Slack notification
   * @param {string} webhookUrl - Slack webhook URL
   * @param {object} testResults - Test results object
   */
  static sendSlackNotification(webhookUrl, testResults) {
    return new Promise((resolve, reject) => {
      if (!webhookUrl) {
        reject(new Error('Slack webhook URL not provided'));
        return;
      }

      const { passed, failed, total, coverage, branch, commitHash } = testResults;
      const status = failed === 0 ? 'SUCCESS' : 'FAILURE';
      const color = failed === 0 ? '36a64f' : 'ff0000';

      const payload = {
        attachments: [
          {
            fallback: `Test Results: ${status}`,
            color: color,
            title: `Test Results - ${status}`,
            title_link: `https://github.com`,
            fields: [
              {
                title: 'Total Tests',
                value: total.toString(),
                short: true
              },
              {
                title: 'Passed',
                value: passed.toString(),
                short: true
              },
              {
                title: 'Failed',
                value: failed.toString(),
                short: true
              },
              {
                title: 'Coverage',
                value: coverage ? `${coverage}%` : 'N/A',
                short: true
              },
              {
                title: 'Branch',
                value: branch || 'unknown',
                short: true
              },
              {
                title: 'Commit',
                value: (commitHash || 'unknown').substring(0, 7),
                short: true
              }
            ],
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      const postData = JSON.stringify(payload);
      const options = {
        hostname: 'hooks.slack.com',
        port: 443,
        path: webhookUrl.replace('https://hooks.slack.com', ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true, message: 'Slack notification sent' });
          } else {
            reject(new Error(`Slack API returned ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Send email notification via generic webhook
   * @param {string} webhookUrl - Webhook URL for email service
   * @param {object} testResults - Test results object
   * @param {string} recipientEmail - Email recipient
   */
  static sendEmailNotification(webhookUrl, testResults, recipientEmail) {
    return new Promise((resolve, reject) => {
      if (!webhookUrl) {
        reject(new Error('Email webhook URL not provided'));
        return;
      }

      const { passed, failed, total, coverage, branch } = testResults;
      const status = failed === 0 ? 'PASSED' : 'FAILED';

      const payload = {
        to: recipientEmail,
        subject: `[CI] Test Results - ${status}`,
        body: `
Test Execution Summary
======================

Status: ${status}
Total Tests: ${total}
Passed: ${passed}
Failed: ${failed}
Code Coverage: ${coverage || 'N/A'}%
Branch: ${branch || 'unknown'}

${failed > 0 ? 'Please check the CI logs for details.' : 'All tests passed!'}

--
Automated CI Notification
        `.trim()
      };

      const postData = JSON.stringify(payload);
      const url = new URL(webhookUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const protocol = url.protocol === 'https:' ? https : require('http');
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, message: 'Email notification sent' });
          } else {
            reject(new Error(`Webhook returned ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Send generic webhook notification
   * @param {string} webhookUrl - Webhook URL
   * @param {object} testResults - Test results object
   */
  static sendWebhookNotification(webhookUrl, testResults) {
    return new Promise((resolve, reject) => {
      if (!webhookUrl) {
        reject(new Error('Webhook URL not provided'));
        return;
      }

      const payload = {
        event: 'test_completed',
        timestamp: new Date().toISOString(),
        results: testResults
      };

      const postData = JSON.stringify(payload);
      const url = new URL(webhookUrl);
      const protocol = url.protocol === 'https:' ? https : require('http');

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, message: 'Webhook notification sent' });
          } else {
            reject(new Error(`Webhook returned ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}

module.exports = NotificationService;
