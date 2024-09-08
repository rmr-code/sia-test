const TextArea = ({ name, value, onChange, placeholder, rows = 5, disabled, ...rest }) => (
  <div className="relative mb-6">
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      className="block w-full px-4 py-2 border border-gray-300 rounded-md bg-transparent text-gray-900 placeholder-transparent focus:outline-none focus:border-gray-700 transition-colors peer"
      placeholder={placeholder}
      disabled={disabled}
      {...rest}
    />
    <label
      htmlFor={name}
      className={`absolute left-4 px-1 transition-all bg-white pointer-events-none 
        ${
          value
            ? 'text-xs -top-2.5'
            : 'text-sm top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:top-2 peer-focus:text-xs peer-focus:-top-2.5'
        }
        text-gray-500`}
    >
      {placeholder}
    </label>
  </div>
);

export default TextArea;
