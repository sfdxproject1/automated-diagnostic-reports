import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import DDRDashboard from './components/DDRDashboard'; // Import your component

// Optional: Create a clean theme for a "client-ready" look
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f4f6f8',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kicks off a consistent baseline to build upon */}
      <CssBaseline />
      
      <main>
        {/* Call the component here */}
        <DDRDashboard />
      </main>
    </ThemeProvider>
  );
}

export default App;