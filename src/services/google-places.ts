import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
}

export interface PlaceDetails extends PlaceResult {
  formatted_phone_number?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  website?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.apiKey = config.google.mapsApiKey;
  }

  async searchNearbyCafes(
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<PlaceResult[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/place/nearbysearch/json`,
        {
          params: {
            location: `${latitude},${longitude}`,
            radius: radiusMeters,
            type: 'cafe',
            key: this.apiKey,
          },
        }
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Google Places API error:', response.data);
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results || [];
    } catch (error) {
      logger.error('Search nearby cafes error:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          fields:
            'place_id,name,formatted_address,geometry,photos,rating,user_ratings_total,types,formatted_phone_number,opening_hours,website,reviews',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Places Details API error:', response.data);
        return null;
      }

      return response.data.result;
    } catch (error) {
      logger.error('Get place details error:', error);
      throw error;
    }
  }

  getPhotoUrl(photoReference: string, maxWidth: number = 800): string {
    return `${this.baseUrl}/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  async searchCafesByText(
    query: string,
    latitude?: number,
    longitude?: number
  ): Promise<PlaceResult[]> {
    try {
      const params: any = {
        query: `${query} cafe`,
        type: 'cafe',
        key: this.apiKey,
      };

      if (latitude && longitude) {
        params.location = `${latitude},${longitude}`;
        params.radius = 10000; // 10km
      }

      const response = await axios.get(`${this.baseUrl}/place/textsearch/json`, {
        params,
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Google Places Text Search API error:', response.data);
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results || [];
    } catch (error) {
      logger.error('Search cafes by text error:', error);
      throw error;
    }
  }

  async searchCafesByName(query: string, limit: number = 20): Promise<PlaceResult[]> {
    const results = await this.searchCafesByText(query);
    return results.slice(0, limit);
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula to calculate distance in kilometers
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const googlePlacesService = new GooglePlacesService();
