'use client';

import React, { memo } from 'react';
import {
  Box,
  Chip,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AppsRounded, FiberManualRecordRounded } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { ActivityLog } from '@/lib/api';
import { EmptyState } from '@/components/ui/DataState';

function formatDuration(seconds: number) {
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

const TimelineRow = memo(function TimelineRow({ log }: { log: ActivityLog }) {
  const ts = (() => {
    try {
      return format(parseISO(log.timestamp), 'HH:mm:ss');
    } catch {
      return '—';
    }
  })();

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
          {ts}
        </Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AppsRounded sx={{ fontSize: 14, color: log.is_idle ? 'warning.main' : 'primary.main' }} />
          <Typography variant="body2" fontWeight={600} noWrap>
            {log.app_name || '—'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ maxWidth: 280 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {log.window_title || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          icon={
            <FiberManualRecordRounded
              sx={{ fontSize: '8px !important', color: log.is_idle ? '#ffb347 !important' : '#00d4aa !important' }}
            />
          }
          label={log.is_idle ? 'Idle' : 'Active'}
          size="small"
          sx={{
            fontSize: '0.68rem',
            fontWeight: 700,
            background: log.is_idle ? 'rgba(255,179,71,0.12)' : 'rgba(0,212,170,0.1)',
            color: log.is_idle ? '#ffb347' : '#00d4aa',
            border: `1px solid ${log.is_idle ? '#ffb34730' : '#00d4aa30'}`,
          }}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {formatDuration(log.duration_seconds)}
        </Typography>
      </TableCell>
    </TableRow>
  );
});

interface ActivityTimelineTableProps {
  loading: boolean;
  logs: ActivityLog[];
  filter: 'all' | 'active' | 'idle';
  onFilterChange: (value: 'all' | 'active' | 'idle') => void;
}

export default function ActivityTimelineTable({
  loading,
  logs,
  filter,
  onFilterChange,
}: ActivityTimelineTableProps) {
  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !log.is_idle;
    return log.is_idle;
  });

  return (
    <>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
          Timeline entries: {filteredLogs.length}
        </Typography>
        <Select
          size="small"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as 'all' | 'active' | 'idle')}
          sx={{ minWidth: 132 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="idle">Idle</MenuItem>
        </Select>
      </Box>

      <TableContainer sx={{ maxHeight: 420 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Application</TableCell>
              <TableCell>Window Title</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton height={22} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="No activity logs found" subtitle="Try changing the timeline filter." />
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => <TimelineRow key={log.id} log={log} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
