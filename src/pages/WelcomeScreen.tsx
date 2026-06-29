import logo from '../assets/logo/wakingdream-logo.png';

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-10 text-center">
      <img
        src={logo}
        alt="Wakingdream"
        className="w-44 h-44 object-contain mb-6 drop-shadow-[0_0_25px_rgba(76,175,80,0.45)]"
      />
      <h1 className="text-4xl font-display font-bold text-smaragd-light mb-2">Welcome to Wakingdream</h1>
      <p className="text-dawn/70 mb-8 max-w-md">
        A WoW 3.3.5a private server experience reimagined — custom raids, dynamic phasing, and a living Emerald Dream.
      </p>
      <button
        onClick={onContinue}
        className="px-8 py-3 bg-smaragd hover:bg-smaragd-light text-dawn font-semibold rounded-lg shadow-lg transition"
      >
        Get Started
      </button>
    </div>
  );
}
