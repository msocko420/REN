import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../components/UserContext";
import { ChromePicker } from 'react-color';
// Adjust the path to import UserContext

const LoginSignup = () => {
    const formRef = useRef(null);
    const navigate = useNavigate();
    const { isAuthenticated, setIsAuthenticated } = useContext(UserContext); // Access the UserContext

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = () => {
        console.log("Attempting Login with", username, password);
        axios.post('http://localhost:8080/api/user/login', { username, password })
            .then(response => {
                if (response.data.success) {
                    console.log("Login successful, redirecting to home...");
                    setIsAuthenticated(true); // Set the user as authenticated
                    navigate("pages/Home");
                } else {
                    setError(response.data.error || 'Login failed');
                }
            })
            .catch(err => {
                setError(err.message);
                console.error("Error during login:", err.message);
            });
    };

    const handleSignup = () => {
        console.log("Attempting Signup with", username, email, password);
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Invalid email address');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        axios.post('http://localhost:8080/api/user/signup', { username, email, password })
            .then(response => {
                if (response.data.success) {
                    console.log("Signup successful, redirecting to home...");
                    setIsAuthenticated(true); // Set the user as authenticated
                    navigate("pages/Home");
                } else {
                    setError(response.data.error || 'Signup failed');
                }
            })
            .catch(err => {
                setError(err.message);
                console.error("Error during signup:", err.message);
            });
    };

    // Initialize Vanta.js effect on the form
    useEffect(() => {
        const vantaEffect = window.VANTA.HALO({
            el: formRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 400.00,
            baseColor: 0xf57845,
            backgroundColor: 0x385749,
            amplitudeFactor: 0.80,
            xOffset: 0.06,
            yOffset: -0.01
        });

        // Cleanup Vanta effect on component unmount
        return () => {
            if (vantaEffect) {
                vantaEffect.destroy();
            }
        };
    }, []);

    return (
        <div className="full-screen-bg">
            <div className="header-container">
                <h1 className="text-4xl font-bold mb-2 text-center">Welcome to the REN3 Platform</h1>
                <h2 className="text-2xl mb-4 text-center">Brought to you By Kash Munkey Creative LLC</h2>
            </div>
            <div ref={formRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>
            <div className="centered-box">
                <h1 className="text-2xl font-bold mb-4 heading-color">{isSignup ? 'Sign Up' : 'Login'}</h1>
                {error && <div className="error-message text-red-600 text-sm mb-2">{error}</div>}
                <input className="w-full p-2 mt-2 mb-4 bg-blue-300 border border-green-300 rounded-md outline-none" type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} />
                {isSignup && <input className="w-full p-2 mt-2 mb-4 bg-gray-100 border border-green-300 rounded-md outline-none" type="text" placeholder="Email" onChange={e => setEmail(e.target.value)} />}
                <input className="w-full p-2 mt-2 mb-4 bg-blue-200 border border-green-300 rounded-md outline-none" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                <button className="w-full p-2 bg-blue-400 text-white font-semibold rounded-md cursor-pointer hover:bg-blue-700 transition duration-300 ease-in-out" onClick={() => {
                    console.log(isSignup ? "Signup button clicked" : "Login button clicked");
                    isSignup ? handleSignup() : handleLogin();
                }}>
                    {isSignup ? 'Sign Up' : 'Login'}
                </button>
                <button className="toggle-button text-green-600 text-sm underline cursor-pointer" onClick={() => setIsSignup(!isSignup)}>{isSignup ? "Already have an account? Log in" : "Create a new account"}</button>
            </div>
            <div className="footer-container">
                <h2 className="text-2xl mb-4 text-center">Current Alpha Phase. Please report bugs to team@kashmunkey.com</h2>
            </div>
        </div>
    );
};

export default LoginSignup;
