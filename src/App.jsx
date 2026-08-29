import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { WorkerProvider } from './context/WorkerContext';
import Dashboard from './pages/Dashboard';
import Detections from './pages/Detections';
import ExternalDetectionDetail from './pages/ExternalDetectionDetail';
import HelmetManagement from './pages/HelmetManagement';
import IncidentDetail from './pages/IncidentDetail';
import Records from './pages/Records';
import WorkerDetail from './pages/WorkerDetail';
import Workers from './pages/Workers';
import './styles/safehelmet.css';

export default function App() {
  return (
    <WorkerProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard/>}/>
            <Route path="/detections" element={<Detections/>}/>
            <Route path="/detections/:id" element={<ExternalDetectionDetail/>}/>
            <Route path="/incident" element={<IncidentDetail/>}/>
            <Route path="/workers" element={<Workers/>}/>
            <Route path="/workers/:workerId" element={<WorkerDetail/>}/>
            <Route path="/records" element={<Records/>}/>
            <Route path="/helmets" element={<HelmetManagement/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkerProvider>
  );
}
