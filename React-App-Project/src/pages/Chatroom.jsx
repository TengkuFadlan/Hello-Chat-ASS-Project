import { useEffect, useState, useRef } from "react";
import { pb, useAuth } from "../contexts/AuthProvider";

function Chatroom() {
    const { currentUser, setUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [newImage, setNewImage] = useState(null); // **Added: State for selected image**
    const messageEndRef = useRef(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newName, setNewName] = useState(currentUser.name || "");
    const [newAvatar, setNewAvatar] = useState(null);
    const [newStatus, setNewStatus] = useState(currentUser.status || ""); // Added
    const [newAbout, setNewAbout] = useState(currentUser.about || "");    // Added
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState("");

    // State for user profile popup
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await pb.collection("messages")
                    .getList(1, 50, { sort: "-created", expand: "user" });
                setMessages(response.items.reverse());
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();

        const listener = async ({ action, record }) => {
            if (action === "create") {
                const user = await pb.collection("users").getOne(record.user);
                record.expand = { user };

                setMessages((prev) => [...prev, record]);
                scrollToBottom();
            }
            if (action === "delete") {
                setMessages((prev) => prev.filter((message) => message.id !== record.id));
            }
        };

        pb.collection("messages").subscribe("*", listener);

        return () => {
            pb.collection("messages").unsubscribe("*", listener);
        };
    }, []);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !newImage) return; // Allow sending if there's text or an image
    
        try {
            // Create FormData
            const formData = new FormData();
            formData.append('text', newMessage.trim());
            formData.append('user', currentUser.id);
    
            // Append image if available
            if (newImage) {
                formData.append('image', newImage);
            }
    
            // Send message with FormData
            await pb.collection("messages").create(formData);
    
            // Reset input fields
            setNewMessage("");
            setNewImage(null); // Reset selected image
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleLogout = () => {
        pb.authStore.clear();
        setUser(null);
    };

    const openProfileModal = () => {
        setIsProfileModalOpen(true);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
        setNewName(currentUser.name || "");
        setNewAvatar(null);
        setNewStatus(currentUser.status || ""); // Reset status
        setNewAbout(currentUser.about || "");   // Reset about
        setUpdateError("");
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateError("");

        try {
            const formData = new FormData();
            formData.append("name", newName);
            formData.append("status", newStatus); // Include status
            formData.append("about", newAbout);   // Include about

            if (newAvatar) {
                formData.append("avatar", newAvatar);
            }

            const updatedUser = await pb.collection("users").update(currentUser.id, formData);
            setUser(updatedUser);
            closeProfileModal();
        } catch (error) {
            console.error("Error updating profile:", error);
            setUpdateError("Failed to update profile. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const getAvatarUrl = (user) => {
        if (user.avatar) {
            return pb.getFileUrl(user, user.avatar);
        }
        // Generate a DiceBear avatar using the user's ID as the seed
        return `https://api.dicebear.com/9.x/identicon/svg?seed=${user.id}`;
    };

    // Function to open user profile modal
    const openUserProfileModal = async (userId) => {
        try {
            const user = await pb.collection("users").getOne(userId);
            setSelectedUser(user);
            setIsUserProfileModalOpen(true);
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    // Function to close user profile modal
    const closeUserProfileModal = () => {
        setIsUserProfileModalOpen(false);
        setSelectedUser(null);
    };

    // **New Function: Handle Message Deletion**
    const handleDeleteMessage = async (messageId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this message?");
        if (!confirmDelete) return;

        try {
            await pb.collection("messages").delete(messageId);
            // Optimistically remove the message from the UI
            setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message. Please try again.");
        }
    };

    // **New Function: Handle Image Selection**
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImage(file);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-800">
            <div className="w-11/12 flex justify-between items-center mb-4">
                <h1 className="text-3xl font-extrabold text-white">
                    Hello Chat
                </h1>
                <div className="flex space-x-2">
                    <button
                        onClick={openProfileModal}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                    >
                        Profile
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="rounded-lg shadow-2xl shadow-blue-600 outline-blue-600 outline outline-1 p-8 w-11/12 h-5/6 bg-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">
                    Welcome
                </h2>
                <div className="flex-1 overflow-y-auto mb-4 border border-gray-500 rounded p-4 bg-gray-800 text-gray-300 h-5/6">
                    {/* Messages Display */}
                    {messages.length > 0 ? (
                        messages.map((msg) => (
                            <div key={msg.id} className="flex items-start mb-4 group relative">
                                <img
                                    src={getAvatarUrl(msg.expand.user)}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full mr-3 object-cover cursor-pointer"
                                    onClick={() => openUserProfileModal(msg.expand.user.id)}
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm mb-1">
                                            <strong
                                                className="text-gray-200 cursor-pointer"
                                                onClick={() => openUserProfileModal(msg.expand.user.id)}
                                            >
                                                {msg.expand.user.name || msg.expand.user.username || "Anonymous"}:
                                            </strong> {msg.text}
                                        </p>
                                        {/* **Delete Button (Visible on Hover)** */}
                                        {msg.user === currentUser.id && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="absolute top-0 right-0 mt-1 mr-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                title="Delete Message"
                                            >
                                                {/* Trash Icon from Heroicons */}
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                {/* Alternatively, use text:
                                                <span className="text-sm">Delete</span> */}
                                            </button>
                                        )}
                                    </div>
                                    {/* **Display Image if Exists** */}
                                    {msg.image && (
                                        <img
                                            src={pb.getFileUrl(msg, msg.image)}
                                            alt="attached"
                                            className="mt-2 max-w-xs rounded"
                                        />
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {new Date(msg.created).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400">No messages yet...</p>
                    )}
                    <div ref={messageEndRef}></div>
                </div>
                <div className="flex items-center">
                    {/* **Image Attach Button** */}
                    <label className="mr-2 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 hover:text-gray-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m12 4v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h14l2-2z" />
                        </svg>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </label>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Send
                    </button>
                </div>
                {/* **Display Selected Image Preview** */}
                {newImage && (
                    <div className="mt-2 flex items-center">
                        <img
                            src={URL.createObjectURL(newImage)}
                            alt="Selected"
                            className="w-16 h-16 object-cover rounded mr-2"
                        />
                        <button
                            onClick={() => setNewImage(null)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove Image"
                        >
                            &times;
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-xl font-semibold mb-4">Update Profile</h3>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    className="mt-1 p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <input
                                    type="text"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">About</label>
                                <textarea
                                    value={newAbout}
                                    onChange={(e) => setNewAbout(e.target.value)}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Avatar</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setNewAvatar(e.target.files[0])}
                                    className="mt-1"
                                />
                            </div>
                            {updateError && (
                                <p className="text-red-500 text-sm">{updateError}</p>
                            )}
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={closeProfileModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUpdating ? "Updating..." : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {isUserProfileModalOpen && selectedUser && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">User Profile</h3>
                            <button
                                onClick={closeUserProfileModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="flex flex-col items-center">
                            <img
                                src={getAvatarUrl(selectedUser)}
                                alt="avatar"
                                className="w-24 h-24 rounded-full mb-4 object-cover"
                            />
                            <h4 className="text-lg font-bold mb-2">{selectedUser.name || selectedUser.username || "Anonymous"}</h4>
                            {selectedUser.status && (
                                <p className="text-sm text-gray-600 mb-2"><strong>Status:</strong> {selectedUser.status}</p>
                            )}
                            {selectedUser.about && (
                                <p className="text-sm text-gray-600"><strong>About:</strong> {selectedUser.about}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chatroom;
