import { useState } from "react"

export const useProfileHooks = () => {
    const [userData, setUserData] = useState<any>(null);
    const [loadingUserData, setLoadingUserData] = useState(false);
    const [userPfp, setUserPfp] = useState<string | null>(null);
    const [username, setUsername] = useState<string>("");

    const fetchProfileDetails = () => {
    setLoadingUserData(true);
    fetch(`https://remotion-backend-b2vw.onrender.com/auth`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed fetch");
        return res.json();
      })
      .then((data) => {
        console.log("User data: ", data);
        setUserPfp(data[0].profilePicture);
        setUsername(data[0].name);
        setUserData(data[0]);
      })
      .catch((err) => console.error("❌ Failed to fetch user details:", err))
      .finally(() => setLoadingUserData(false));
  };

  return {
    fetchProfileDetails,
    userData,
    loadingUserData,
    username,
    userPfp
  }
}