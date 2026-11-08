// components/MapPicker.jsx
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useEffect, useState } from "react";

function ClickHandler({ onPick, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPick(e.latlng);
    },
  });
  return null;
}

function Recenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position, map.getZoom(), { animate: true });
  }, [position?.lat, position?.lng]);

  return null;
}

export default function MapPicker({ center, onPick }) {
  const [position, setPosition] = useState(center);

  useEffect(() => {
    if (!center) return;
    setPosition(center);
  }, [center?.lat, center?.lng]);

  const safe = position ?? center ?? { lat: 59.9343, lng: 30.3351 };

  return (
    <MapContainer
      key={`${safe.lat},${safe.lng}`}  
      center={safe}
      zoom={15}
      style={{ height: 300, width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      <Recenter position={safe} />

      <ClickHandler
        onPick={onPick}
        setPosition={setPosition}
      />

      <Marker position={safe} />
    </MapContainer>
  );
}

