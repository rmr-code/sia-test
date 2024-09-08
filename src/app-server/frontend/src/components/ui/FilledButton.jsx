const FilledButton = ({ children, onClick, disabled, ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-6 py-2 bg-black text-white text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-gray-800 transition-colors"
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default FilledButton;
