import { useRef, useState } from "react";
import { pb, useAuth } from "../contexts/AuthProvider";

function Login() {
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const { setUser } = useAuth();

    const handleUsernameInput = (e) => {
        e.target.value = e.target.value.replace(/\s/g, "");
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent form submission from reloading the page
        setErrorMessage(""); // Clear any previous error message

        const username = usernameRef.current.value;
        const password = passwordRef.current.value;

        try {
            if (isRegistering) {
                // Register the user
                await pb.collection("users").create({
                    username,
                    password,
                    passwordConfirm: password,
                });
                alert("Registration successful! Please log in.");
                setIsRegistering(false); // Switch to login view after registration
            } else {
                // Log in the user
                const authData = await pb.collection("users").authWithPassword(username, password);
                console.log("Logged in successfully:", authData);
                setUser(pb.authStore.model)
            }
        } catch (error) {
            setErrorMessage(error.message || "An error occurred.");
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-800">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-white">
                Hello Chat
            </h1>
            <div className="rounded-lg shadow-2xl shadow-blue-600 outline-blue-600 outline outline-1 p-8 w-80 bg-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">
                    {isRegistering ? "Register" : "Login"}
                </h2>
                {errorMessage && (
                    <div className="text-red-500 text-center mb-4">{errorMessage}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        ref={usernameRef}
                        type="text"
                        placeholder="Enter username"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onInput={handleUsernameInput} // Restrict spaces dynamically
                        required
                    />
                    <input
                        ref={passwordRef}
                        type="password"
                        placeholder="Enter password"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        {isRegistering ? "Register" : "Login"}
                    </button>
                </form>
                <p
                    className="text-sm text-center text-gray-400 mt-4 cursor-pointer hover:text-white transition"
                    onClick={() => setIsRegistering(!isRegistering)}
                >
                    {isRegistering
                        ? "Already have an account? Login here."
                        : "Don't have an account? Register here."}
                </p>
            </div>
        </div>
    );
}

export default Login;
