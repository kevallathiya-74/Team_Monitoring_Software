'use client';

import React, { memo, useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { PlayCircleRounded } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { Recording } from '@/lib/api';
import { EmptyState } from '@/components/ui/DataState';

function formatDuration(seconds: number) {
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function toDisplayDate(value: string) {
  try {
    return format(parseISO(value), 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
}

function canPreview(path: string) {
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/');
}

const RecordingRow = memo(function RecordingRow({
  rec,
  onOpen,
}: {
  rec: Recording;
  onOpen: (rec: Recording) => void;
}) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontFamily="monospace" fontSize="0.78rem" color="text.secondary" noWrap>
          {rec.file_path.split(/[\\/]/).pop()}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {toDisplayDate(rec.start_time || rec.created_at)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {formatDuration(rec.duration_seconds)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="caption"
          fontFamily="monospace"
          color="text.secondary"
          fontSize="0.7rem"
          sx={{
            background: 'rgba(255,255,255,0.04)',
            px: 1,
            py: 0.4,
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'inline-block',
            maxWidth: 260,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {rec.file_path}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <IconButton
          size="small"
          onClick={() => onOpen(rec)}
          disabled={!canPreview(rec.file_path)}
          sx={{ color: 'primary.main' }}
        >
          <PlayCircleRounded fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

interface RecordingsTableProps {
  loading: boolean;
  recordings: Recording[];
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: number) => void;
}

export default function RecordingsTable({
  loading,
  recordings,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: RecordingsTableProps) {
  const [query, setQuery] = useState('');
  const [activePreview, setActivePreview] = useState<Recording | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recordings;
    return recordings.filter((rec) => {
      const filename = rec.file_path.split(/[\\/]/).pop()?.toLowerCase() || '';
      return filename.includes(q) || rec.file_path.toLowerCase().includes(q);
    });
  }, [query, recordings]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  return (
    <>
      <Box sx={{ p: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Filter recordings by file name or path"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onPageChange(0);
          }}
        />
      </Box>

      <TableContainer sx={{ maxHeight: 420 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>File</TableCell>
              <TableCell>Recorded At</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>File Path</TableCell>
              <TableCell align="right">Preview</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton height={22} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="No recordings available" subtitle="Recording metadata will appear here when available." />
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((rec) => <RecordingRow key={rec.id} rec={rec} onOpen={setActivePreview} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        rowsPerPageOptions={[5, 10, 20]}
      />

      <Dialog
        open={Boolean(activePreview)}
        onClose={() => setActivePreview(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Recording Preview</DialogTitle>
        <DialogContent>
          {activePreview && canPreview(activePreview.file_path) ? (
            <video controls style={{ width: '100%', borderRadius: 8 }}>
              <source src={activePreview.file_path} />
            </video>
          ) : (
            <Typography color="text.secondary">Preview not supported for this recording path.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
