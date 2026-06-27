import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ProtectedRoute({ children }) {

    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {

        const checkUser = async () => {

            try {

                await axios.get(
                    "http://localhost:8000/api/v1/users/current-user",
                    {
                        withCredentials: true
                    }
                );

                setAuthenticated(true);

            } catch (error) {

                setAuthenticated(false);

            } finally {

                setLoading(false);

            }

        };

        checkUser();

    }, []);

    if (loading) {

        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );

    }

    if (!authenticated) {

        return <Navigate to="/" replace />;

    }

    return children;
}