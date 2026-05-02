'use client';

import useSWR from 'swr';
import {
  getDashboardDevices,
  getDeviceRecordings,
  getDeviceTimeline,
  type ActivityLog,
  type DeviceSummary,
  type Recording,
} from '@/lib/api';
import { subHours } from 'date-fns';

const REFRESH_MS = 10_000;

export interface DeviceReport {
  device: DeviceSummary;
  activeSeconds: number;
  idleSeconds: number;
  topApps: { name: string; seconds: number }[];
  logCount: number;
}

export const monitoringKeys = {
  employeeMe: '/dashboard/employee/me',
  devices: '/dashboard/devices',
  timeline: (deviceId: string, startTime?: string, endTime?: string) =>
    ['device-timeline', deviceId, startTime ?? '', endTime ?? ''] as const,
  recordings: (deviceId: string, skip = 0, limit = 50) =>
    ['device-recordings', deviceId, skip, limit] as const,
  reports: (hours: number) => ['device-reports', hours] as const,
};

export function useDashboardDevices() {
  return useSWR<DeviceSummary[]>(
    monitoringKeys.devices,
    async () => (await getDashboardDevices()).data,
    {
      refreshInterval: REFRESH_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 5_000,
    },
  );
}

export function useEmployeeMe() {
  return useSWR<DeviceSummary>(
    monitoringKeys.employeeMe,
    async () => (await (await import('@/lib/api')).getEmployeeMe()).data,
    {
      refreshInterval: REFRESH_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 5_000,
    },
  );
}

export function useDeviceTimeline(deviceId?: string, startTime?: string, endTime?: string) {
  return useSWR<ActivityLog[]>(
    deviceId ? monitoringKeys.timeline(deviceId, startTime, endTime) : null,
    async ([, id, start, end]: readonly [string, string, string, string]) => (
      await getDeviceTimeline(id, start || undefined, end || undefined)
    ).data,
    {
      refreshInterval: REFRESH_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );
}

export function useDeviceRecordings(deviceId?: string, skip = 0, limit = 50) {
  return useSWR<Recording[]>(
    deviceId ? monitoringKeys.recordings(deviceId, skip, limit) : null,
    async ([, id, offset, pageSize]: readonly [string, string, number, number]) => (
      await getDeviceRecordings(id, offset, pageSize)
    ).data,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 8_000,
    },
  );
}

export function useDeviceReports(hours: number) {
  return useSWR<DeviceReport[]>(
    monitoringKeys.reports(hours),
    async ([, h]: readonly [string, number]) => {
      const devices = (await getDashboardDevices()).data;
      const startTime = subHours(new Date(), h).toISOString();
      const endTime = new Date().toISOString();

      const reportData = await Promise.all(
        devices.map(async (device) => {
          try {
            const logs = (await getDeviceTimeline(device.id, startTime, endTime)).data;
            const activeSeconds = logs
              .filter((l) => !l.is_idle)
              .reduce((s, l) => s + l.duration_seconds, 0);
            const idleSeconds = logs
              .filter((l) => l.is_idle)
              .reduce((s, l) => s + l.duration_seconds, 0);

            const appMap: Record<string, number> = {};
            logs
              .filter((l) => !l.is_idle && l.app_name)
              .forEach((l) => {
                appMap[l.app_name] = (appMap[l.app_name] || 0) + l.duration_seconds;
              });

            const topApps = Object.entries(appMap)
              .map(([name, seconds]) => ({ name, seconds }))
              .sort((a, b) => b.seconds - a.seconds);

            return { device, activeSeconds, idleSeconds, topApps, logCount: logs.length };
          } catch {
            return { device, activeSeconds: 0, idleSeconds: 0, topApps: [], logCount: 0 };
          }
        }),
      );

      reportData.sort((a, b) => b.activeSeconds - a.activeSeconds);
      return reportData;
    },
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 10_000,
    },
  );
}
