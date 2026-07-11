export interface SuggestedPlace {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

export const SAVED_PLACES: SuggestedPlace[] = [
  { id: 'casa', icon: '🏠', title: 'Casa', subtitle: 'Guardado', lat: 6.9615, lng: -75.4192 },
  { id: 'hospital', icon: '🏥', title: 'Hospital San Vicente', subtitle: 'Cra 19', lat: 6.9642, lng: -75.4171 },
  { id: 'parque', icon: '⛪', title: 'Parque Principal', subtitle: 'Centro', lat: 6.9601, lng: -75.4184 },
];

export const DESTINATION_SUGGESTIONS: SuggestedPlace[] = [
  ...SAVED_PLACES,
  { id: 'terminal', icon: '🚌', title: 'Terminal de Transportes', subtitle: 'Salida sur', lat: 6.9553, lng: -75.4218 },
  { id: 'colegio', icon: '🏫', title: 'Colegio San Luis Gonzaga', subtitle: 'Cra 22', lat: 6.9629, lng: -75.4149 },
  { id: 'plaza', icon: '🛒', title: 'Plaza de Mercado', subtitle: 'Centro', lat: 6.9598, lng: -75.4201 },
];

export const CURRENT_LOCATION_MOCK = {
  address: 'Calle 20 #22-04 · Yarumal',
  lat: 6.9612,
  lng: -75.4178,
};
