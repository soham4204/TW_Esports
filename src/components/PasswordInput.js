import React from 'react';

const PasswordInput = ({ value, onChange }) => { // Destructure props correctly
    return (
        <div className="mb-2 flex flex-col w-full">
            <label htmlFor="password" className="flex text-lg mb-2">Password</label>
            <input type="password" id="password" name="password" value={value} onChange={onChange} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-blue-500" />
        </div>
    )
}

export default PasswordInput;
