import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Box,
  IconButton,
  Alert,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface MuiModelDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  modelName: string;
  progress: number;
  status: string;
  isComplete: boolean;
  error?: string;
}

const MuiModelDownloadModal: React.FC<MuiModelDownloadModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  modelName,
  progress,
  status,
  isComplete,
  error,
}) => {
  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 300,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon color="primary" />
          <Typography variant="h6" component="span">
            Downloading Model
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Stack spacing={3}>
          {/* Model Name */}
          <Typography
            variant="h5"
            component="h3"
            textAlign="center"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              py: 1,
            }}
          >
            {modelName}
          </Typography>

          {/* Progress Section */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          {/* Status Section */}
          <Box sx={{ minHeight: 60, display: 'flex', alignItems: 'center' }}>
            {isComplete ? (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '1rem',
                    fontWeight: 500,
                  },
                }}
              >
                Download Complete!
              </Alert>
            ) : error ? (
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                sx={{
                  width: '100%',
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            ) : (
              status && (
                <Box sx={{ width: '100%' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {status}
                  </Typography>
                </Box>
              )
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {!isComplete && !error && (
          <Button
            onClick={handleCancel}
            variant="outlined"
            color="secondary"
            sx={{ minWidth: 100 }}
          >
            Cancel Download
          </Button>
        )}
        {(isComplete || error) && (
          <Button onClick={onClose} variant="contained" color="primary" sx={{ minWidth: 100 }}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MuiModelDownloadModal;
