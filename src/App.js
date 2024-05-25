import {BrowserRouter, Route, Routes} from 'react-router-dom';
import HomeComponent from './routes/Home';
import LoginComponent from './routes/Login';
import RegisterComponent from './routes/Register';
import ContactUsComponent from './routes/ContactUs';
import ProfileComponent from './routes/Profile';
import LandingPageComponent from './routes/LandingPage';
import ForgotPasswordComponent from './routes/ForgotPassword';
import AdminDashboardComponent from './routes/AdminDashboard';
import MyTournamentComponent from './routes/MyTournaments';

function App() {
  return (
    <div className="App h-screen font-poppins">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPageComponent />} />
          <Route path="/register" element={<RegisterComponent />} />
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/forgotpassword" element={<ForgotPasswordComponent />} />
          <Route path="/contactus" element={<ContactUsComponent />} />
          <Route path="/profile" element={<ProfileComponent />} />
          <Route path="/home" element={<HomeComponent />} />
          <Route path="/admindashboard" element={<AdminDashboardComponent />} />         
          <Route path="/my-tournaments" element={<MyTournamentComponent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
