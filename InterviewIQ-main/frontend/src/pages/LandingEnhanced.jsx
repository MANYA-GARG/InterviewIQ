import AuthLanding from '../components/auth/AuthLanding';

// The landing page, login and sign-up now share one page and one look.
// The previous landing page is kept in LandingEnhanced.original.jsx.
const LandingEnhanced = () => <AuthLanding initialMode="login" syncUrl={false} />;

export default LandingEnhanced;
