import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { RuntimeErrorBoundary } from './components/RuntimeErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(<RuntimeErrorBoundary><App /></RuntimeErrorBoundary>);
