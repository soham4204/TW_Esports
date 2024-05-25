import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ path }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(path); 
    };

    return (
        <div className="w-full text-blue-400">
            <button onClick={handleClick}>Back</button>
        </div>
    );
};

export default BackButton;
