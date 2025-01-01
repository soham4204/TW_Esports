import React, { useState } from 'react';
import logo from '../assets/Logo.png';
import Navbar from '../components/Navbar';

const ContactUsComponent = () => {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch('https://formspree.io/f/xayrkvpp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    subject,
                    message
                })
            });
            if (response.ok) {
                setSubmitted(true);
                setEmail('');
                setSubject('');
                setMessage('');
            } else {
                throw new Error('Failed to submit form');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="h-screen overflow-auto w-full bg-slate-900 text-white">
            <Navbar/>
            <div className="p-6 max-w-3xl mx-auto">
                <div className="border border-slate-400 rounded-lg shadow-md bg-slate-900">
                    <div className="p-8 text-center">
                        <img src={logo} alt="TW Esports Logo" className="h-32 mx-auto mb-6" />
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-blue-500"
                            />
                            <input 
                                type="text" 
                                placeholder="Subject" 
                                value={subject} 
                                onChange={(e) => setSubject(e.target.value)} 
                                required 
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-blue-500"
                            />
                            <textarea 
                                placeholder="Message" 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                                required 
                                rows={5} 
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-blue-500"
                            />
                            <button 
                                type="submit" 
                                disabled={submitting} 
                                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                            {submitted && (
                                <p className="text-green-500 mt-4">
                                    Message submitted successfully!
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUsComponent;
