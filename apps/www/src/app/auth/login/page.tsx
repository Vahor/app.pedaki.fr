import LoginForm from './login-form.tsx';

export default function LoginPage() {
  return (
    <div className="relative flex flex-col items-center justify-center md:w-[768px]">
      <div className="w-full max-w-screen-sm px-8 py-16">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Se connecter</h1>
            <p className="text-sm text-secondary">
              Entrez vos identifiants pour vous connecter à votre compte.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
