const ErrorBlock = ({ children }) => (
  <blockquote className="text-red-600 border-l-4 border-red-600 pl-4 text-sm font-light">
    {children}
  </blockquote>
);

export default ErrorBlock;
