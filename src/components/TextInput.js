const TextInput = ({ label, name, value, onChange }) => {
    return (
        <div className="mb-2 flex flex-col w-full">
            <label htmlFor={name} className="flex text-lg mb-2">{label}</label>
            <input type="text" id={name} name={name} value={value} onChange={onChange} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 full focus:outline-none focus:border-blue-500" />
        </div>
    )
}

export default TextInput;