import { useState } from "react";

export const useRendersHooks = () =>{
     const [renders, setRenders] = useState<any[]>([]);
      const [selectedRenders, setSelectedRenders] = useState<string[]>([]);
      const [loadingRenders, setLoadingRenders] = useState(false);
    
    const fetchRenders = () => {
        setLoadingRenders(true);
        fetch(`https://remotion-backend-b2vw.onrender.com/renders`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch renders");
            return res.json();
          })
          .then((data) => {
            if (data.length > 0) {
              const sortedRenders = data.slice().sort((a: any, b: any) => {
                const aDate = a.renderedAt ? new Date(a.renderedAt).getTime() : 0;
                const bDate = b.renderedAt ? new Date(b.renderedAt).getTime() : 0;
                return bDate - aDate;
              });
              setRenders(sortedRenders);
            }

            console.log("rendersdata", data);
          })
          .catch((err) => console.error("❌ Failed to fetch renders:", err))
          .finally(() => setLoadingRenders(false));
      };
    
      const handleDeleteRenders = async () => {
        try {
          await Promise.all(
            selectedRenders.map((id) =>
              fetch(`https://remotion-backend-b2vw.onrender.com/renders/${id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              })
            )
          );
          setRenders((prev) => prev.filter((p) => !selectedRenders.includes(p.id)));
          setSelectedRenders([]);
        } catch (err) {
          console.error("Error deleting projects:", err);
        }
      };

      return{
        fetchRenders,
        handleDeleteRenders,
        loadingRenders,
        renders,
        setRenders,
        selectedRenders,
        setSelectedRenders
      }
    
}