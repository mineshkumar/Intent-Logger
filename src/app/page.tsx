import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { IntentLogger } from '@/components/IntentLogger';
import { Login } from '@/components/Login';

function MainApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Login />
      </div>
    );
  }

  return <IntentLogger />;
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
