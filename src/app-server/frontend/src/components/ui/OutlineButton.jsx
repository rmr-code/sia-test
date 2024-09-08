const OutlineButton = ({ children, onClick, disabled, ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-6 py-2 border border-black text-black text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-gray-200 transition-colors"
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default OutlineButton;
