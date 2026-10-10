"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

const markerIcon=L.divIcon({className:"farm-map-marker",html:"<span>🌱</span>",iconSize:[34,34],iconAnchor:[17,30]});

function Picker({position,onChange}:{position:[number,number];onChange:(lat:number,lon:number)=>void}){
  useMapEvents({click:event=>onChange(Number(event.latlng.lat.toFixed(5)),Number(event.latlng.lng.toFixed(5)))});
  return <Marker position={position} icon={markerIcon}/>;
}

export default function FarmMap({lat,lon,onChange}:{lat:number;lon:number;onChange:(lat:number,lon:number)=>void}){
  return <MapContainer center={[lat,lon]} zoom={8} scrollWheelZoom className="farm-map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Picker position={[lat,lon]} onChange={onChange}/></MapContainer>
}
