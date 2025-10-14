import "../styles/birdButton.css";

export default function BirdButtons() {
  return (
    <div className="bg-black p-10">
      <button className="relative px-8 py-3 font-semibold text-white rounded-full overflow-hidden bg-gradient-to-r from-primary-800 to-secondary-800 animate-gradient shadow-lg">
        <span className="relative z-10">✨ Click</span>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20 blur-xl opacity-70 animate-gradient"></div>
      </button>
    </div>
  );
}
