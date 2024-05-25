import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="text-center">
                <div className="spinner-border animate-spin inline-block w-12 h-12 border-4 rounded-full text-blue-500" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-4 text-xl">Loading, please wait...</p>
            </div>
        </div>
    );
}

export default LoadingScreen;
