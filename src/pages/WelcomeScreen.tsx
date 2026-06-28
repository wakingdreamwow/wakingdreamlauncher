export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-10 text-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-smaragd to-smaragd-dark flex items-center justify-center mb-6 shadow-2xl">
        <span className="text-5xl">🐉</span>
      </div>
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
