import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomeComponent from './routes/Home';
import ContactUsComponent from './routes/ContactUs';
import LandingPageComponent from './routes/LandingPage';
import AdminDashboardComponent from './routes/AdminDashboard';
import MyTournamentComponent from './routes/MyTournaments';
import TournamentOverview from './routes/TournamentOverview';
import AboutUs from './routes/AboutUs';
import PrivacyPolicy from './routes/PrivacyPolicy';
import Terms from './routes/Terms';
import Disclaimer from './routes/Disclaimer';
import DiscordCallback from './routes/DiscordCallback';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App h-screen font-poppins">
      <BrowserRouter>
        <Routes>
          {/* Main User Flow */}
          <Route path="/" element={<LandingPageComponent />} />
          <Route path="/home" element={<HomeComponent />} />
          <Route path="/my-tournaments" element={<MyTournamentComponent />} />
          <Route path="/contactus" element={<ContactUsComponent />} />
          <Route path="/tournament/:id" element={<TournamentOverview />} />
          <Route path="/auth/discord/callback" element={<DiscordCallback />} />

          {/* Secret Admin Route - Use a unique string here */}
          <Route path="/admin" element={<AdminDashboardComponent />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          
          {/* Catch-all Redirect to Home */}
          <Route path="*" element={<HomeComponent />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;