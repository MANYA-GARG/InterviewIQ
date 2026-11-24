import AuthLanding from '../components/auth/AuthLanding';

// Sign in and create account share one page; this route opens it on "Create account".
const Register = () => <AuthLanding initialMode="register" />;

export default Register;
