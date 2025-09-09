/**
 * MCP Test Client - External Agent Integration Demo
 * 
 * This demonstrates how external AI agents can connect to Guardian Dashboard
 * via the MCP (Model Context Protocol) endpoints.
 * 
 * Run with: node mcp-test-client.js
 */

const axios = require('axios');

// Configuration
const MCP_BASE_URL = process.env.MCP_URL || 'http://localhost:3001/api/mcp';
const AGENT_NAME = 'External-Monitor-Agent';
const AGENT_KEY = process.env.AGENT_KEY || 'demo-agent-key';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// MCP Client Class
class MCPClient {
  constructor(baseUrl, agentName) {
    this.baseUrl = baseUrl;
    this.agentName = agentName;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Agent-Name': agentName,
      'Authorization': `Bearer ${AGENT_KEY}`
    };
  }

  async detectDisaster(location, radius = 50) {
    try {
      log(`\n🔍 Detecting disasters near [${location.lat}, ${location.lon}]...`, 'cyan');
      
      const response = await axios.post(
        `${this.baseUrl}/tools/detect_disaster`,
        {
          arguments: {
            location,
            radius,
            disasterTypes: ['all']
          }
        },
        { headers: this.headers }
      );

      const { result } = response.data;
      log(`✅ Found ${result.detectionsFound} disasters`, 'green');
      
      if (result.disasters) {
        result.disasters.forEach(disaster => {
          log(`  - ${disaster.type.toUpperCase()} at [${disaster.location.lat}, ${disaster.location.lon}]`, 'yellow');
          log(`    Severity: ${disaster.severity || disaster.magnitude}/10`, 'yellow');
        });
      }

      return result;
    } catch (error) {
      log(`❌ Detection failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async analyzeThreat(disasterId) {
    try {
      log(`\n🧠 Analyzing threat for disaster ${disasterId}...`, 'cyan');
      
      const response = await axios.post(
        `${this.baseUrl}/tools/analyze_threat`,
        {
          arguments: {
            disasterId,
            includeEvacuation: true
          }
        },
        { headers: this.headers }
      );

      const { result } = response.data;
      log(`✅ Threat Analysis Complete`, 'green');
      log(`  - Threat Level: ${result.threatLevel}`, result.threatLevel === 'high' ? 'red' : 'yellow');
      log(`  - Affected Population: ${result.affectedPopulation.toLocaleString()}`, 'yellow');
      log(`  - Evacuation Required: ${result.evacuationRequired ? 'YES' : 'NO'}`, result.evacuationRequired ? 'red' : 'green');
      log(`  - Confidence: ${(result.confidence * 100).toFixed(1)}%`, 'blue');

      return result;
    } catch (error) {
      log(`❌ Analysis failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async dispatchAlert(alertType, message, channels = ['all']) {
    try {
      log(`\n🚨 Dispatching ${alertType} alert...`, 'cyan');
      
      const response = await axios.post(
        `${this.baseUrl}/tools/dispatch_alert`,
        {
          arguments: {
            alertType,
            message,
            channels
          }
        },
        { headers: this.headers }
      );

      const { result } = response.data;
      log(`✅ Alert Dispatched Successfully`, 'green');
      log(`  - Alerts Sent: ${result.alertsSent.toLocaleString()}`, 'green');
      log(`  - Channels: ${result.channels.join(', ')}`, 'blue');

      return result;
    } catch (error) {
      log(`❌ Alert dispatch failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async getAgentStatus() {
    try {
      log(`\n📊 Getting Guardian Dashboard agent status...`, 'cyan');
      
      const response = await axios.post(
        `${this.baseUrl}/tools/get_agent_status`,
        {
          arguments: {
            squad: 'all'
          }
        },
        { headers: this.headers }
      );

      const { result } = response.data;
      log(`✅ Agent Status Retrieved`, 'green');
      log(`  - Total Agents: ${result.totalAgents}`, 'blue');
      log(`  - Active Agents: ${result.activeAgents}`, 'green');
      log(`  - Detection Squad: ${result.squads.detection.agents} agents (${result.squads.detection.status})`, 'blue');
      log(`  - Analysis Squad: ${result.squads.analysis.agents} agents (${result.squads.analysis.status})`, 'blue');
      log(`  - Action Squad: ${result.squads.action.agents} agents (${result.squads.action.status})`, 'blue');

      return result;
    } catch (error) {
      log(`❌ Status check failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async getStatistics() {
    try {
      log(`\n📈 Getting system statistics...`, 'cyan');
      
      const response = await axios.get(
        `${this.baseUrl}/resources/statistics`,
        { headers: this.headers }
      );

      const { data } = response.data;
      log(`✅ Statistics Retrieved`, 'green');
      log(`  - Total Disasters: ${data.totalDisasters}`, 'blue');
      log(`  - Active Disasters: ${data.activeDisasters}`, 'red');
      log(`  - Alerts Sent: ${data.alertsSent.toLocaleString()}`, 'yellow');
      log(`  - Lives Saved: ${data.livesSaved.toLocaleString()} 🎉`, 'bright');
      log(`  - System Uptime: ${data.uptime}`, 'green');

      return data;
    } catch (error) {
      log(`❌ Statistics fetch failed: ${error.message}`, 'red');
      throw error;
    }
  }
}

// Main Demo Function
async function runDemo() {
  log('\n' + '='.repeat(60), 'bright');
  log('🤖 MCP External Agent Integration Demo', 'bright');
  log(`Agent: ${AGENT_NAME}`, 'bright');
  log(`Connecting to: ${MCP_BASE_URL}`, 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const client = new MCPClient(MCP_BASE_URL, AGENT_NAME);

  try {
    // 1. Check agent status
    await client.getAgentStatus();
    await sleep(2000);

    // 2. Get system statistics
    await client.getStatistics();
    await sleep(2000);

    // 3. Detect disasters in California
    const disasters = await client.detectDisaster({ lat: 34.0522, lon: -118.2437 }, 100);
    await sleep(2000);

    // 4. Analyze threat for first disaster
    if (disasters && disasters.disasters && disasters.disasters.length > 0) {
      const firstDisaster = disasters.disasters[0];
      await client.analyzeThreat(firstDisaster.id);
      await sleep(2000);

      // 5. Dispatch alert if threat is high
      await client.dispatchAlert(
        'evacuation',
        `EMERGENCY: ${firstDisaster.type} detected. Evacuate immediately!`,
        ['sms', 'email', 'push']
      );
    }

    log('\n' + '='.repeat(60), 'bright');
    log('✅ MCP Integration Demo Complete!', 'green');
    log('This external agent successfully:', 'bright');
    log('  1. Connected to Guardian Dashboard MCP endpoint', 'green');
    log('  2. Retrieved agent and system status', 'green');
    log('  3. Detected disasters in a specific area', 'green');
    log('  4. Analyzed threat levels', 'green');
    log('  5. Dispatched emergency alerts', 'green');
    log('='.repeat(60) + '\n', 'bright');

  } catch (error) {
    log('\n❌ Demo failed with error:', 'red');
    log(error.message, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Helper function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if axios is installed
try {
  require.resolve('axios');
} catch (e) {
  log('⚠️  axios is not installed. Installing...', 'yellow');
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
}

// Run the demo
runDemo().catch(error => {
  log(`\n Fatal error: ${error.message}`, 'red');
  process.exit(1);
});