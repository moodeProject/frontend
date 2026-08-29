import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Detections from './pages/Detections';
import ExternalDetectionDetail from './pages/ExternalDetectionDetail';
import IncidentDetail from './pages/IncidentDetail';
import Workers from './pages/Workers';
import Placeholder from './pages/Placeholder';
import './styles/safehelmet.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/detections" element={<Detections/>}/>
          <Route path="/detections/:id" element={<ExternalDetectionDetail/>}/>
          <Route path="/incident" element={<IncidentDetail/>}/>
          <Route path="/workers" element={<Workers/>}/>
          <Route path="/records" element={<Placeholder title="사고·알림 기록"/>}/>
          <Route path="/helmets" element={<Placeholder title="헬멧 관리"/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
