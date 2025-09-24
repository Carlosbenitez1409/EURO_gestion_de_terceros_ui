// Tipos para los datos de ubicaciones basados en los JSON
export interface Country {
    id: number;
    name: string;
    native_name: string;
    alpha_code: string;
    short_alpha_code: string;
    numeric_code: number;
    flag: string;
    demonym: string;
    capital: string;
    phone_extension: string;
    lat: string;
    lng: string;
    currency_id: number;
    language_id: number;
    timezone_id: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface City {
    id: number;
    name: string;
    alpha_code: string;
    district: string;
    country_id: number;
}