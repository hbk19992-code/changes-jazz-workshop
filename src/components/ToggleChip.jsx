// Compact on/off pill used throughout the preferences toolbar.

export function ToggleChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 border text-xs transition-all ${
        active
          ? "bg-[#1a0f08] text-[#fbf4e3] border-[#1a0f08]"
          : "bg-transparent border-[#1a0f08]/40 text-[#1a0f08] hover:border-[#1a0f08]"
      }`}
      style={{ fontFamily: "'Fraunces', serif" }}
    >
      {label}
    </button>
  );
}
