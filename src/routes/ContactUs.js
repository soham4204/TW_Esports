import React, { useState } from 'react';
import logo from '../assets/Logo.png';
import BackButton from '../components/BackButton';

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
        <div className="flex flex-col overflow-auto items-center justify-center h-screen bg-gray-900 text-white w-full">
            <div className="text-center h-full w-4/5">
                <div className="mt-4 flex float-start">
                    <BackButton path="/home"/>
                </div>
                <div className="w-full flex justify-center mt-6">
                    <img src={logo} alt="TW Esports Logo" className="flex h-24 mb-4" />
                </div>
                <h1 className="text-3xl font-bold">Contact Us</h1>
                <form className="mt-4 flex flex-col justify-center" onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />
                    <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />
                    <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500"></textarea>
                    <button type="submit" disabled={submitting} className="ml-4 bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold my-2 mx-4">
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                    {submitted && <p className="text-green-500">Message submitted successfully!</p>}
                </form>
            </div>
        </div>
    );

}

export default ContactUsComponent;