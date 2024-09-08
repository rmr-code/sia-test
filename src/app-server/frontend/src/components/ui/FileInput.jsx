const FileInput = ({ onChange, accept, disabled, ...rest }) => (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Add New Documents
    </label>
    <input
      type="file"
      accept={accept}
      onChange={onChange}
      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:border-gray-700"
      disabled={disabled}
      {...rest}
    />
  </div>
);

export default FileInput;
