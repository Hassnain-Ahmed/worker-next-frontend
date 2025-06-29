"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `API request failed: ${response.statusText}`
    );
  }

  return response.json();
}

// Dashboard API
export async function fetchDashboardOverview() {
  return apiRequest("/dashboard/overview");
}

export async function fetchDevicesDashboard(params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(
    `/dashboard/devices${queryString ? `?${queryString}` : ""}`
  );
}

// Media API
export async function fetchMedia(params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/media${queryString ? `?${queryString}` : ""}`);
}

export async function fetchMediaStats(params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/media/stats${queryString ? `?${queryString}` : ""}`);
}

export async function fetchMediaAnalytics(params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/media/analytics${queryString ? `?${queryString}` : ""}`);
}

export async function getMediaDownloadUrl(mediaId: string) {
  return apiRequest(`/media/${mediaId}/download`);
}

export async function deleteMedia(mediaId: string, permanent = false) {
  return apiRequest(`/media/${mediaId}`, {
    method: "DELETE",
    body: JSON.stringify({ permanent }),
  });
}

export async function batchDeleteMedia(mediaIds: string[], permanent = false) {
  return apiRequest("/media/batch-delete", {
    method: "POST",
    body: JSON.stringify({ mediaIds, permanent }),
  });
}

export async function findDuplicateMedia(params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/media/duplicates${queryString ? `?${queryString}` : ""}`);
}

// Location API
export async function fetchLocationHistory(deviceId: string, params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(
    `/location/${deviceId}/history${queryString ? `?${queryString}` : ""}`
  );
}

export async function fetchLocationStats(deviceId: string, days = 30) {
  return apiRequest(`/location/${deviceId}/stats?days=${days}`);
}

export async function fetchLocationHeatmap(deviceId: string, params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(
    `/location/${deviceId}/heatmap${queryString ? `?${queryString}` : ""}`
  );
}

export async function fetchLocationZones(deviceId: string, params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(
    `/location/${deviceId}/zones${queryString ? `?${queryString}` : ""}`
  );
}

export async function exportLocationData(deviceId: string, params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(
    `${API_BASE_URL}/location/${deviceId}/export${
      queryString ? `?${queryString}` : ""
    }`
  );

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Export failed: ${response.statusText}`
    );
  }

  return response.text();
}

// Device API
export async function fetchDevices(params: any = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/devices${queryString ? `?${queryString}` : ""}`);
}

export async function fetchDeviceDetails(deviceId: string) {
  return apiRequest(`/devices/${deviceId}`);
}

export async function updateDevice(deviceId: string, data: any) {
  return apiRequest(`/devices/${deviceId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDevice(deviceId: string) {
  return apiRequest(`/devices/${deviceId}`, {
    method: "DELETE",
  });
}
