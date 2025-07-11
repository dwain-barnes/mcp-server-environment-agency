# Environment Agency Flood Monitoring MCP Server

[![npm version](https://badge.fury.io/js/mcp-server-environment-agency.svg)](https://badge.fury.io/js/mcp-server-environment-agency)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides access to the UK Environment Agency's Real Time Flood Monitoring API. This server allows you to access near real-time flood warnings, water level measurements, flow data, and monitoring station information.

## 🌊 Features

- **🚨 Flood Warnings & Alerts**: Get current flood warnings and alerts with severity levels
- **📍 Flood Areas**: Access information about flood alert and warning areas  
- **🏭 Monitoring Stations**: Find water level and flow monitoring stations across the UK
- **📊 Real-time Measurements**: Access water levels, flows, and other measurements updated every 15 minutes
- **📈 Historical Data**: Retrieve historical readings and measurements
- **🗺️ Geographic Filtering**: Filter data by location using latitude, longitude, and distance
- **🔓 No API Key Required**: Uses open government data with no registration needed

## 📦 Installation

### For Claude Desktop Users

Add this to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "environment-agency": {
      "command": "npx",
      "args": ["-y", "mcp-server-environment-agency"]
    }
  }
}
```

### For Developers

```bash
npm install -g mcp-server-environment-agency
```

## 🛠️ Available Tools

### Flood Warning Tools
- **`get_flood_warnings`** - Get current flood warnings and alerts
- **`get_flood_warning`** - Get details of a specific flood warning  
- **`get_flood_areas`** - Get flood areas (regions where warnings may apply)
- **`get_flood_area`** - Get details of a specific flood area

### Monitoring Station Tools
- **`get_monitoring_stations`** - Get monitoring stations that measure water levels, flows, etc.
- **`get_monitoring_station`** - Get detailed information about a specific monitoring station
- **`get_measures`** - Get measurement types available across all stations
- **`get_station_measures`** - Get all measurement types from a specific station

### Reading Tools
- **`get_readings`** - Get measurement readings from all stations
- **`get_measure_readings`** - Get readings for a specific measurement type
- **`get_station_readings`** - Get all readings from a specific monitoring station

## 💬 Usage Examples


```
Get detailed information for station 1029TH (Bourton Dickler)
Find monitoring stations within 25km of Cambridge
Find monitoring stations in Yorkshire
Show me today's water level readings from any 5 stations
```


## 📊 Data Types

### Flood Warning Severity Levels
1. **Severe Flood Warning** - Severe Flooding, Danger to Life
2. **Flood Warning** - Flooding is Expected, Immediate Action Required  
3. **Flood Alert** - Flooding is Possible, Be Prepared
4. **Warning no Longer in Force** - The warning is no longer in force

### Measurement Parameters
- **Water Level** (`level`) - Water levels at monitoring stations
- **Flow** (`flow`) - Water flow rates
- **Temperature** (`temperature`) - Air temperature  
- **Wind** (`wind`) - Wind direction and speed

### Station Types
- **SingleLevel** - Single water level measurement
- **MultiTraceLevel** - Multiple level measurements
- **Coastal** - Coastal monitoring stations
- **Groundwater** - Groundwater level monitoring
- **Meteorological** - Weather measurements

## 🚀 Development

### Prerequisites
- Node.js 18+
- TypeScript

### Setup
```bash
git clone https://github.com/dwain-barnes/mcp-server-environment-agency.git
cd mcp-server-environment-agency
npm install
```

### Build
```bash
npm run build
```

### Test
```bash
# Test the server
npm start

# Run test script
node test-server.js
```

### Local Development
```bash
# Link for local testing
npm link

# Test with Claude Desktop using local version
```

## 📄 Data Attribution

This server uses Environment Agency flood and river level data from the real-time data API (Beta), provided under the [Open Government Licence](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

## 🔄 API Updates and Reliability

- Data is updated every 15 minutes
- The API may redirect during high load - the client follows redirects automatically  
- Responses may be cached for short periods
- No service level guarantee - not suitable for safety-critical applications

## 📋 Rate Limits and Best Practices

- For tracking all measurements, use a single call every 15 minutes
- Use geographic and parameter filters to reduce response sizes
- The API has built-in limits: default 500 items, maximum 10,000 for readings
- Use pagination with `limit` and `offset` parameters for large datasets


## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Environment Agency for providing open flood monitoring data
- Model Context Protocol team for the excellent framework
- UK Government for open data initiatives



**Built by [Dwain Barnes](https://github.com/dwain-barnes)** 🇬🇧
