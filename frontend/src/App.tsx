import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Layout from './components/Layout'
import { WorkflowProvider } from './context/WorkflowContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import Home from './pages/Home'
import { CVInputPage } from './pages/CVInputPage'
import { CVReviewPage } from './pages/CVReviewPage'
import { JobInputPage } from './pages/JobInputPage'
import { AnalysisResultsPage } from './pages/AnalysisResultsPage'
import UploadResume from './pages/UploadResume'
import MatchResults from './pages/MatchResults'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <WorkflowProvider>
                    <Layout>
                      <Home />
                    </Layout>
                  </WorkflowProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cv-input"
              element={
                <ProtectedRoute>
                  <WorkflowProvider>
                    <Layout>
                      <CVInputPage />
                    </Layout>
                  </WorkflowProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cv-review"
              element={
                <ProtectedRoute>
                  <WorkflowProvider>
                    <Layout>
                      <CVReviewPage />
                    </Layout>
                  </WorkflowProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-input"
              element={
                <ProtectedRoute>
                  <WorkflowProvider>
                    <Layout>
                      <JobInputPage />
                    </Layout>
                  </WorkflowProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis-results"
              element={
                <ProtectedRoute>
                  <WorkflowProvider>
                    <Layout>
                      <AnalysisResultsPage />
                    </Layout>
                  </WorkflowProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <WorkflowProvider>
                    <Layout>
                      <UploadResume />
                    </Layout>
                  </WorkflowProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <WorkflowProvider>
                    <Layout>
                      <MatchResults />
                    </Layout>
                  </WorkflowProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
