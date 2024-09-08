const ErrorButton = ({title, handleClick, type}) => {
    return (
        <button
            type={type}
            onClick={handleClick}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700"
        >
            {title}
        </button>
    )
}

export default ErrorButton
