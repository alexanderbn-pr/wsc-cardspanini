export interface StickerFilters {
    id?: number;
    idTeam?: number;
    number?: string;
    name?: string;
    position?: string;
    check?: boolean;
    quantity?: number;
    page: number;
    limit: number;
}