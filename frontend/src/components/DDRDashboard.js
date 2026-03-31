import React, { useState } from 'react';
import { 
  Container, Typography, Button, Card, CardContent, 
  Grid, Box, CircularProgress, Divider, Chip, Stack 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const DDRDashboard = () => {
  const [files, setFiles] = useState({ inspection: null, thermal: null });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleFileChange = (e, type) => {
    setFiles({ ...files, [type]: e.target.files[0] });
  };

  const generateDDR = async () => {
    if (!files.inspection || !files.thermal) {
      alert("Please upload both required documents.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('files', files.inspection);
    formData.append('files', files.thermal);

    try {
      const response = await axios.post('http://localhost:5000/process-ddr', formData);
      // Assume the backend returns the full JSON object for display
      setReport(response.data.data); 
    } catch (error) {
      console.error("Error generating report", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        AI Detailed Diagnostic Report (DDR)
      </Typography>

      {/* Upload Section */}
      <Card sx={{ mb: 4, p: 3, border: '1px dashed #ccc' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>
              Upload Inspection Report
              <input type="file" hidden onChange={(e) => handleFileChange(e, 'inspection')} />
            </Button>
            {files.inspection && <Typography variant="caption">{files.inspection.name}</Typography>}
          </Grid>
          <Grid item xs={12} md={5}>
            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>
              Upload Thermal Report
              <input type="file" hidden onChange={(e) => handleFileChange(e, 'thermal')} />
            </Button>
            {files.thermal && <Typography variant="caption">{files.thermal.name}</Typography>}
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              onClick={generateDDR} 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Analyze"}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Generated Report View */}
      {report && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>1. Property Issue Summary [cite: 43]</Typography>
          <Card sx={{ mb: 3, bgcolor: '#f9f9f9' }}>
            <CardContent>
              <Typography variant="h6" color="primary">{report.property_name || "Not Available"}</Typography>
              <Typography paragraph>{report.issue_summary}</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={`Severity: ${report.severity}`} color={report.severity === 'High' ? 'error' : 'warning'} />
                <Chip label={`Root Cause: ${report.root_cause}`} variant="outlined" />
              </Stack>
            </CardContent>
          </Card>

          <Typography variant="h5" sx={{ mb: 2 }}>2. Area-wise Observations [cite: 44]</Typography>
          <Grid container spacing={3}>
            {report.observations.map((obs, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{obs.area_name}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="body1"><strong>Observation:</strong> {obs.observation_text}</Typography>
                        <Typography variant="body2" color="text.secondary"><strong>Thermal Reading:</strong> {obs.thermal_reading}</Typography>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                          <Typography variant="body2"><strong>Recommended Action:</strong> {obs.recommended_action}</Typography>
                        </Box>
                        {obs.conflict_detected && (
                          <Chip label="Conflict Detected" color="secondary" size="small" sx={{ mt: 1 }} />
                        )}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ border: '1px solid #ddd', p: 1, borderRadius: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Relevant Image</Typography>
                          {!obs.image_path || obs.image_path === 'Image Not Available' ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', my: 2 }}>
                              Image Not Available
                            </Typography>
                          ) : (
                            <img 
                              src={`http://localhost:5000${obs.image_path}`} 
                              alt={`Observation for ${obs.area_name}`} 
                              style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default DDRDashboard;