const SubmitButton = ({ label }) => {
  return (
    <button
      type="submit"
      className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {label}
    </button>
  );
};

export default SubmitButton;
