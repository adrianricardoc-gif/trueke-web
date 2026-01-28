import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SafeMeetingPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  place_type: string;
  is_verified: boolean;
  rating: number;
  reviews_count: number;
  operating_hours: unknown;
  created_at: string;
}

export function useSafeMeetingPoints() {
  const [meetingPoints, setMeetingPoints] = useState<SafeMeetingPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingPoints();
  }, []);

  const fetchMeetingPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("safe_meeting_points")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      setMeetingPoints(data || []);
    } catch (error) {
      console.error("Error fetching meeting points:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMeetingPointsByCity = (city: string) => {
    return meetingPoints.filter(
      (mp) => mp.city.toLowerCase() === city.toLowerCase()
    );
  };

  const getNearbyMeetingPoints = (lat: number, lng: number, radiusKm: number = 5) => {
    return meetingPoints.filter((mp) => {
      const distance = calculateDistance(lat, lng, mp.latitude, mp.longitude);
      return distance <= radiusKm;
    });
  };

  // Haversine formula for distance calculation
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return {
    meetingPoints,
    loading,
    getMeetingPointsByCity,
    getNearbyMeetingPoints,
    refetch: fetchMeetingPoints,
  };
}
