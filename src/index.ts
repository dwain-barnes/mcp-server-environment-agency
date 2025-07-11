#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Types for Environment Agency API responses
interface FloodWarning {
  "@id": string;
  description: string;
  eaAreaName: string;
  eaRegionName: string;
  floodArea: FloodArea;
  floodAreaID: string;
  isTidal: boolean;
  message?: string;
  severity: string;
  severityLevel: number;
  timeMessageChanged: string;
  timeRaised: string;
  timeSeverityChanged: string;
}

interface FloodArea {
  "@id": string;
  county: string;
  notation: string;
  polygon: string;
  riverOrSea?: string;
  description?: string;
  eaAreaName?: string;
  eaRegionName?: string;
  lat?: number;
  long?: number;
  quickDialNumber?: string;
}

interface Station {
  "@id": string;
  RLOIid?: string;
  catchmentName?: string;
  dateOpened?: string;
  datumOffset?: number;
  label: string;
  measures: Measure[];
  notation: string;
  riverName?: string;
  stationReference: string;
  town?: string;
  wiskiID?: string;
  lat?: number;
  long?: number;
  easting?: number;
  northing?: number;
  status?: string;
  statusReason?: string;
  statusDate?: string;
  type?: string[];
  stageScale?: Scale;
  downstageScale?: Scale;
}

interface Measure {
  "@id": string;
  datumType?: string;
  label: string;
  latestReading?: Reading;
  notation: string;
  parameter: string;
  parameterName: string;
  period?: number;
  qualifier?: string;
  station: string;
  stationReference: string;
  unit?: string;
  unitName?: string;
  valueType?: string;
}

interface Reading {
  "@id"?: string;
  date: string;
  dateTime: string;
  measure: string | Measure;
  value?: number;
}

interface Scale {
  highestRecent?: Reading;
  maxOnRecord?: Reading;
  minOnRecord?: Reading;
  scaleMax?: number;
  typicalRangeHigh?: number;
  typicalRangeLow?: number;
}

interface APIResponse<T> {
  "@context": string;
  meta: {
    publisher: string;
    licence: string;
    documentation: string;
    version: string;
    comment?: string;
    limit?: number;
    offset?: number;
    hasFormat?: string[];
  };
  items: T;
}

// Base API class
class EnvironmentAgencyAPI {
  private baseUrl = "https://environment.data.gov.uk/flood-monitoring";

  private async makeRequest<T>(endpoint: string): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MCP-Environment-Agency-Server/1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new McpError(ErrorCode.InvalidRequest, "Resource not found");
      }
      throw new McpError(ErrorCode.InternalError, `API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<APIResponse<T>>;
  }

  // Flood warnings
  async getFloodWarnings(params: {
    minSeverity?: number;
    county?: string;
    lat?: number;
    long?: number;
    dist?: number;
  } = {}): Promise<APIResponse<FloodWarning[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.minSeverity) searchParams.set('min-severity', params.minSeverity.toString());
    if (params.county) searchParams.set('county', params.county);
    if (params.lat && params.long) {
      searchParams.set('lat', params.lat.toString());
      searchParams.set('long', params.long.toString());
      if (params.dist) searchParams.set('dist', params.dist.toString());
    }

    const queryString = searchParams.toString();
    return this.makeRequest(`/id/floods${queryString ? '?' + queryString : ''}`);
  }

  async getFloodWarning(id: string): Promise<APIResponse<FloodWarning>> {
    return this.makeRequest(`/id/floods/${id}`);
  }

  // Flood areas
  async getFloodAreas(params: {
    lat?: number;
    long?: number;
    dist?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<APIResponse<FloodArea[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.lat && params.long) {
      searchParams.set('lat', params.lat.toString());
      searchParams.set('long', params.long.toString());
      if (params.dist) searchParams.set('dist', params.dist.toString());
    }
    if (params.limit) searchParams.set('_limit', params.limit.toString());
    if (params.offset) searchParams.set('_offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.makeRequest(`/id/floodAreas${queryString ? '?' + queryString : ''}`);
  }

  async getFloodArea(areaCode: string): Promise<APIResponse<FloodArea>> {
    return this.makeRequest(`/id/floodAreas/${areaCode}`);
  }

  // Stations
  async getStations(params: {
    parameterName?: string;
    parameter?: string;
    qualifier?: string;
    label?: string;
    town?: string;
    catchmentName?: string;
    riverName?: string;
    stationReference?: string;
    RLOIid?: string;
    search?: string;
    lat?: number;
    long?: number;
    dist?: number;
    type?: string;
    status?: string;
    view?: 'full';
    limit?: number;
    offset?: number;
  } = {}): Promise<APIResponse<Station[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.parameterName) searchParams.set('parameterName', params.parameterName);
    if (params.parameter) searchParams.set('parameter', params.parameter);
    if (params.qualifier) searchParams.set('qualifier', params.qualifier);
    if (params.label) searchParams.set('label', params.label);
    if (params.town) searchParams.set('town', params.town);
    if (params.catchmentName) searchParams.set('catchmentName', params.catchmentName);
    if (params.riverName) searchParams.set('riverName', params.riverName);
    if (params.stationReference) searchParams.set('stationReference', params.stationReference);
    if (params.RLOIid) searchParams.set('RLOIid', params.RLOIid);
    if (params.search) searchParams.set('search', params.search);
    if (params.lat && params.long) {
      searchParams.set('lat', params.lat.toString());
      searchParams.set('long', params.long.toString());
      if (params.dist) searchParams.set('dist', params.dist.toString());
    }
    if (params.type) searchParams.set('type', params.type);
    if (params.status) searchParams.set('status', params.status);
    if (params.view) searchParams.set('_view', params.view);
    if (params.limit) searchParams.set('_limit', params.limit.toString());
    if (params.offset) searchParams.set('_offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.makeRequest(`/id/stations${queryString ? '?' + queryString : ''}`);
  }

  async getStation(id: string): Promise<APIResponse<Station>> {
    return this.makeRequest(`/id/stations/${id}`);
  }

  // Measures
  async getMeasures(params: {
    parameterName?: string;
    parameter?: string;
    qualifier?: string;
    stationReference?: string;
    station?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<APIResponse<Measure[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.parameterName) searchParams.set('parameterName', params.parameterName);
    if (params.parameter) searchParams.set('parameter', params.parameter);
    if (params.qualifier) searchParams.set('qualifier', params.qualifier);
    if (params.stationReference) searchParams.set('stationReference', params.stationReference);
    if (params.station) searchParams.set('station', params.station);
    if (params.limit) searchParams.set('_limit', params.limit.toString());
    if (params.offset) searchParams.set('_offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.makeRequest(`/id/measures${queryString ? '?' + queryString : ''}`);
  }

  async getStationMeasures(stationId: string): Promise<APIResponse<Measure[]>> {
    return this.makeRequest(`/id/stations/${stationId}/measures`);
  }

  async getMeasure(id: string): Promise<APIResponse<Measure>> {
    return this.makeRequest(`/id/measures/${id}`);
  }

  // Readings
  async getReadings(params: {
    latest?: boolean;
    today?: boolean;
    date?: string;
    startdate?: string;
    enddate?: string;
    since?: string;
    parameter?: string;
    qualifier?: string;
    stationReference?: string;
    station?: string;
    view?: 'full';
    sorted?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<APIResponse<Reading[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.latest) searchParams.set('latest', '');
    if (params.today) searchParams.set('today', '');
    if (params.date) searchParams.set('date', params.date);
    if (params.startdate) searchParams.set('startdate', params.startdate);
    if (params.enddate) searchParams.set('enddate', params.enddate);
    if (params.since) searchParams.set('since', params.since);
    if (params.parameter) searchParams.set('parameter', params.parameter);
    if (params.qualifier) searchParams.set('qualifier', params.qualifier);
    if (params.stationReference) searchParams.set('stationReference', params.stationReference);
    if (params.station) searchParams.set('station', params.station);
    if (params.view) searchParams.set('_view', params.view);
    if (params.sorted) searchParams.set('_sorted', '');
    if (params.limit) searchParams.set('_limit', params.limit.toString());
    if (params.offset) searchParams.set('_offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.makeRequest(`/data/readings${queryString ? '?' + queryString : ''}`);
  }

  async getMeasureReadings(measureId: string, params: {
    latest?: boolean;
    today?: boolean;
    date?: string;
    startdate?: string;
    enddate?: string;
    since?: string;
    view?: 'full';
    sorted?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<APIResponse<Reading[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.latest) searchParams.set('latest', '');
    if (params.today) searchParams.set('today', '');
    if (params.date) searchParams.set('date', params.date);
    if (params.startdate) searchParams.set('startdate', params.startdate);
    if (params.enddate) searchParams.set('enddate', params.enddate);
    if (params.since) searchParams.set('since', params.since);
    if (params.view) searchParams.set('_view', params.view);
    if (params.sorted) searchParams.set('_sorted', '');
    if (params.limit) searchParams.set('_limit', params.limit.toString());
    if (params.offset) searchParams.set('_offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.makeRequest(`/id/measures/${measureId}/readings${queryString ? '?' + queryString : ''}`);
  }

  async getStationReadings(stationId: string, params: {
    latest?: boolean;
    today?: boolean;
    date?: string;
    startdate?: string;
    enddate?: string;
    since?: string;
    view?: 'full';
    sorted?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<APIResponse<Reading[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.latest) searchParams.set('latest', '');
    if (params.today) searchParams.set('today', '');
    if (params.date) searchParams.set('date', params.date);
    if (params.startdate) searchParams.set('startdate', params.startdate);
    if (params.enddate) searchParams.set('enddate', params.enddate);
    if (params.since) searchParams.set('since', params.since);
    if (params.view) searchParams.set('_view', params.view);
    if (params.sorted) searchParams.set('_sorted', '');
    if (params.limit) searchParams.set('_limit', params.limit.toString());
    if (params.offset) searchParams.set('_offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.makeRequest(`/id/stations/${stationId}/readings${queryString ? '?' + queryString : ''}`);
  }
}

// Initialize server
const server = new Server({
  name: "environment-agency-flood-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

const api = new EnvironmentAgencyAPI();

// Tool definitions
const TOOLS = [
  {
    name: "get_flood_warnings",
    description: "Get current flood warnings and alerts. Updated every 15 minutes.",
    inputSchema: {
      type: "object",
      properties: {
        min_severity: {
          type: "number",
          description: "Minimum severity level (1=Severe Flood Warning, 2=Flood Warning, 3=Flood Alert, 4=No longer in force)",
          enum: [1, 2, 3, 4],
        },
        county: {
          type: "string",
          description: "Filter by county name (e.g., 'Somerset', 'Yorkshire')",
        },
        lat: {
          type: "number",
          description: "Latitude for geographic filter (WGS84)",
        },
        long: {
          type: "number",
          description: "Longitude for geographic filter (WGS84)",
        },
        dist: {
          type: "number",
          description: "Distance in km for geographic filter (used with lat/long)",
        },
      },
    },
  },
  {
    name: "get_flood_warning",
    description: "Get details of a specific flood warning by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Flood warning ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_flood_areas",
    description: "Get flood areas (regions where warnings/alerts may apply)",
    inputSchema: {
      type: "object",
      properties: {
        lat: {
          type: "number",
          description: "Latitude for geographic filter (WGS84)",
        },
        long: {
          type: "number",
          description: "Longitude for geographic filter (WGS84)",
        },
        dist: {
          type: "number",
          description: "Distance in km for geographic filter",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default 500)",
          default: 500,
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_flood_area",
    description: "Get details of a specific flood area by area code",
    inputSchema: {
      type: "object",
      properties: {
        area_code: {
          type: "string",
          description: "Flood area code (e.g., '122WAC953')",
        },
      },
      required: ["area_code"],
    },
  },
  {
    name: "get_monitoring_stations",
    description: "Get monitoring stations that measure water levels, flows, etc.",
    inputSchema: {
      type: "object",
      properties: {
        parameter_name: {
          type: "string",
          description: "Parameter name (e.g., 'Water Level', 'Flow', 'Temperature')",
        },
        parameter: {
          type: "string",
          description: "Short parameter name (e.g., 'level', 'flow', 'temperature')",
        },
        qualifier: {
          type: "string",
          description: "Qualifier (e.g., 'Stage', 'Downstream Stage', 'Groundwater', 'Tidal Level')",
        },
        town: {
          type: "string",
          description: "Filter by town name",
        },
        catchment_name: {
          type: "string",
          description: "Filter by catchment name",
        },
        river_name: {
          type: "string",
          description: "Filter by river name",
        },
        search: {
          type: "string",
          description: "Search text in station labels",
        },
        lat: {
          type: "number",
          description: "Latitude for geographic filter (WGS84)",
        },
        long: {
          type: "number",
          description: "Longitude for geographic filter (WGS84)",
        },
        dist: {
          type: "number",
          description: "Distance in km for geographic filter",
        },
        type: {
          type: "string",
          description: "Station type",
          enum: ["SingleLevel", "MultiTraceLevel", "Coastal", "Groundwater", "Meteorological"],
        },
        status: {
          type: "string",
          description: "Station status",
          enum: ["Active", "Closed", "Suspended"],
        },
        view: {
          type: "string",
          description: "Set to 'full' for detailed information including scale data",
          enum: ["full"],
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
        },
      },
    },
  },
  {
    name: "get_monitoring_station",
    description: "Get detailed information about a specific monitoring station",
    inputSchema: {
      type: "object",
      properties: {
        station_id: {
          type: "string",
          description: "Station ID (e.g., '1491TH')",
        },
      },
      required: ["station_id"],
    },
  },
  {
    name: "get_measures",
    description: "Get measurement types available across all stations",
    inputSchema: {
      type: "object",
      properties: {
        parameter_name: {
          type: "string",
          description: "Parameter name (e.g., 'Water Level', 'Flow')",
        },
        parameter: {
          type: "string",
          description: "Short parameter name (e.g., 'level', 'flow')",
        },
        qualifier: {
          type: "string",
          description: "Qualifier (e.g., 'Stage', 'Downstream Stage')",
        },
        station_reference: {
          type: "string",
          description: "Station reference ID",
        },
        station: {
          type: "string",
          description: "Station URI",
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
        },
      },
    },
  },
  {
    name: "get_station_measures",
    description: "Get all measurement types available from a specific station",
    inputSchema: {
      type: "object",
      properties: {
        station_id: {
          type: "string",
          description: "Station ID",
        },
      },
      required: ["station_id"],
    },
  },
  {
    name: "get_readings",
    description: "Get measurement readings from all stations. Updated every 15 minutes.",
    inputSchema: {
      type: "object",
      properties: {
        latest: {
          type: "boolean",
          description: "Get only the most recent reading for each measure",
        },
        today: {
          type: "boolean",
          description: "Get all readings from today",
        },
        date: {
          type: "string",
          description: "Get readings from specific date (YYYY-MM-DD)",
        },
        startdate: {
          type: "string",
          description: "Start date for date range (YYYY-MM-DD)",
        },
        enddate: {
          type: "string",
          description: "End date for date range (YYYY-MM-DD)",
        },
        parameter: {
          type: "string",
          description: "Filter by parameter (e.g., 'level', 'flow')",
        },
        qualifier: {
          type: "string",
          description: "Filter by qualifier (e.g., 'Groundwater', 'Tidal Level')",
        },
        station_reference: {
          type: "string",
          description: "Filter by station reference",
        },
        station: {
          type: "string",
          description: "Filter by station URI",
        },
        view: {
          type: "string",
          description: "Set to 'full' for detailed measure information",
          enum: ["full"],
        },
        sorted: {
          type: "boolean",
          description: "Sort by date (descending)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default 500, max 10000)",
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
        },
      },
    },
  },
  {
    name: "get_measure_readings",
    description: "Get readings for a specific measurement type",
    inputSchema: {
      type: "object",
      properties: {
        measure_id: {
          type: "string",
          description: "Measure ID (e.g., '1491TH-level-stage-i-15_min-mASD')",
        },
        latest: {
          type: "boolean",
          description: "Get only the most recent reading",
        },
        today: {
          type: "boolean",
          description: "Get all readings from today",
        },
        date: {
          type: "string",
          description: "Get readings from specific date (YYYY-MM-DD)",
        },
        startdate: {
          type: "string",
          description: "Start date for date range (YYYY-MM-DD)",
        },
        enddate: {
          type: "string",
          description: "End date for date range (YYYY-MM-DD)",
        },
        since: {
          type: "string",
          description: "Get readings since specific datetime (ISO format)",
        },
        view: {
          type: "string",
          description: "Set to 'full' for detailed information",
          enum: ["full"],
        },
        sorted: {
          type: "boolean",
          description: "Sort by date (descending)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
        },
      },
      required: ["measure_id"],
    },
  },
  {
    name: "get_station_readings",
    description: "Get all readings from a specific monitoring station",
    inputSchema: {
      type: "object",
      properties: {
        station_id: {
          type: "string",
          description: "Station ID",
        },
        latest: {
          type: "boolean",
          description: "Get only the most recent readings",
        },
        today: {
          type: "boolean",
          description: "Get all readings from today",
        },
        date: {
          type: "string",
          description: "Get readings from specific date (YYYY-MM-DD)",
        },
        startdate: {
          type: "string",
          description: "Start date for date range (YYYY-MM-DD)",
        },
        enddate: {
          type: "string",
          description: "End date for date range (YYYY-MM-DD)",
        },
        since: {
          type: "string",
          description: "Get readings since specific datetime (ISO format)",
        },
        view: {
          type: "string",
          description: "Set to 'full' for detailed information",
          enum: ["full"],
        },
        sorted: {
          type: "boolean",
          description: "Sort by date (descending)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
        },
      },
      required: ["station_id"],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Type guard to ensure args is an object
  if (!args || typeof args !== 'object') {
    throw new McpError(ErrorCode.InvalidRequest, "Invalid arguments provided");
  }

  try {
    switch (name) {
      case "get_flood_warnings": {
        const result = await api.getFloodWarnings({
          minSeverity: args.min_severity as number | undefined,
          county: args.county as string | undefined,
          lat: args.lat as number | undefined,
          long: args.long as number | undefined,
          dist: args.dist as number | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_flood_warning": {
        const result = await api.getFloodWarning(args.id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_flood_areas": {
        const result = await api.getFloodAreas({
          lat: args.lat as number | undefined,
          long: args.long as number | undefined,
          dist: args.dist as number | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_flood_area": {
        const result = await api.getFloodArea(args.area_code as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_monitoring_stations": {
        const result = await api.getStations({
          parameterName: args.parameter_name as string | undefined,
          parameter: args.parameter as string | undefined,
          qualifier: args.qualifier as string | undefined,
          town: args.town as string | undefined,
          catchmentName: args.catchment_name as string | undefined,
          riverName: args.river_name as string | undefined,
          search: args.search as string | undefined,
          lat: args.lat as number | undefined,
          long: args.long as number | undefined,
          dist: args.dist as number | undefined,
          type: args.type as string | undefined,
          status: args.status as string | undefined,
          view: args.view as 'full' | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_monitoring_station": {
        const result = await api.getStation(args.station_id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_measures": {
        const result = await api.getMeasures({
          parameterName: args.parameter_name as string | undefined,
          parameter: args.parameter as string | undefined,
          qualifier: args.qualifier as string | undefined,
          stationReference: args.station_reference as string | undefined,
          station: args.station as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_station_measures": {
        const result = await api.getStationMeasures(args.station_id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_readings": {
        const result = await api.getReadings({
          latest: args.latest as boolean | undefined,
          today: args.today as boolean | undefined,
          date: args.date as string | undefined,
          startdate: args.startdate as string | undefined,
          enddate: args.enddate as string | undefined,
          parameter: args.parameter as string | undefined,
          qualifier: args.qualifier as string | undefined,
          stationReference: args.station_reference as string | undefined,
          station: args.station as string | undefined,
          view: args.view as 'full' | undefined,
          sorted: args.sorted as boolean | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_measure_readings": {
        const result = await api.getMeasureReadings(args.measure_id as string, {
          latest: args.latest as boolean | undefined,
          today: args.today as boolean | undefined,
          date: args.date as string | undefined,
          startdate: args.startdate as string | undefined,
          enddate: args.enddate as string | undefined,
          since: args.since as string | undefined,
          view: args.view as 'full' | undefined,
          sorted: args.sorted as boolean | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_station_readings": {
        const result = await api.getStationReadings(args.station_id as string, {
          latest: args.latest as boolean | undefined,
          today: args.today as boolean | undefined,
          date: args.date as string | undefined,
          startdate: args.startdate as string | undefined,
          enddate: args.enddate as string | undefined,
          since: args.since as string | undefined,
          view: args.view as 'full' | undefined,
          sorted: args.sorted as boolean | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Environment Agency Flood Monitoring MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});