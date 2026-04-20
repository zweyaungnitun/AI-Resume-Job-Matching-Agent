import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { WorkflowProvider } from './context/WorkflowContext'
import Home from './pages/Home'
import { CVInputPage } from './pages/CVInputPage'
import { CVReviewPage } from './pages/CVReviewPage'
import { JobInputPage } from './pages/JobInputPage'
import { AnalysisResultsPage } from './pages/AnalysisResultsPage'
import UploadResume from './pages/UploadResume'
import MatchResults from './pages/MatchResults'

function App() {
  return (
    <Router>
      <WorkflowProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cv-input" element={<CVInputPage />} />
            <Route path="/cv-review" element={<CVReviewPage />} />
            <Route path="/job-input" element={<JobInputPage />} />
            <Route path="/analysis-results" element={<AnalysisResultsPage />} />
            <Route path="/upload" element={<UploadResume />} />
            <Route path="/matches" element={<MatchResults />} />
          </Routes>
        </Layout>
      </WorkflowProvider>
    </Router>
  )
}

export default App
