// src/components/CourierMap.jsx
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
} from "react-leaflet";
import { useMemo } from "react";

const nn = (v) => Number(v);

/** routePath: [{ lat, lng }] с бэка (полилиния по дорогам); иначе ломаная по точкам заказов */
export default function CourierMap({
  available = [],
  route = [],
  routePath = null,
  routingWarning = null,
}) {
  const center = useMemo(() => {
    const first = route[0] ?? available[0];
    if (!first) return { lat: 56.31643, lng: 44.010554 };
    return {
      lat: nn(first.delivery_lat),
      lng: nn(first.delivery_lng),
    };
  }, [available, route]);

  const lineFromStops = useMemo(
    () => route.map((o) => [nn(o.delivery_lat), nn(o.delivery_lng)]),
    [route]
  );

  const lineFromGraphHopper = useMemo(() => {
    if (!Array.isArray(routePath) || routePath.length < 2) return null;
    return routePath.map((p) => [nn(p.lat), nn(p.lng)]);
  }, [routePath]);

  const routeLine = lineFromGraphHopper ?? lineFromStops;

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-2">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: 520, width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {routeLine.length >= 2 && (
          <Polyline positions={routeLine} weight={4} color="#2563eb" />
        )}

        {available.map((o) => (
          <CircleMarker
            key={`av-${o.delivery_id ?? o.order_id}`}
            center={[nn(o.delivery_lat), nn(o.delivery_lng)]}
            radius={9}
            pathOptions={{
              color: "#15803d",
              fillColor: "#22c55e",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1 min-w-[10rem]">
                <div className="font-semibold text-green-800">
                  Доступен · заказ #{o.order_id}
                </div>
                <div className="text-sm">{o.delivery_address}</div>
                <div className="text-xs text-neutral-600">
                  очередь: {o.queue_position ?? "-"}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {route.map((o, i) => (
          <CircleMarker
            key={`rt-${o.delivery_id ?? o.id ?? i}`}
            center={[nn(o.delivery_lat), nn(o.delivery_lng)]}
            radius={11}
            pathOptions={{
              color: "#1e40af",
              fillColor: "#3b82f6",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1 min-w-[10rem]">
                <div className="font-semibold text-blue-900">
                  {route.length > 1
                    ? `В пути · шаг ${i + 1} из ${route.length} · заказ #${o.order_id}`
                    : `В пути · заказ #${o.order_id}`}
                </div>
                <div className="text-sm">{o.delivery_address}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {routingWarning ? (
        <div className="text-xs text-amber-700 rounded-md bg-amber-50 border border-amber-100 px-2 py-1.5">
          {routingWarning}
        </div>
      ) : null}
    </div>
  );
}
