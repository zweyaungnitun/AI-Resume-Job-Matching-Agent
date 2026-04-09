import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import UploadResume from './pages/UploadResume'
import MatchResults from './pages/MatchResults'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadResume />} />
          <Route path="/matches" element={<MatchResults />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
