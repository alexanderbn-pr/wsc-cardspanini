import { Team } from "../../domain/entities/Team.js";
import { Sticker } from "../../domain/entities/Sticker.js";
import { TeamRepository } from "../../domain/repositories/team.repository.js";
import teamsData from "../../data/teams.json" with { type: "json" };

/**
 * Raw team data as it exists in teams.json.
 * Fields may differ from the domain entity — the adapter handles the mapping.
 */
interface RawTeam {
    name: string;
    stickers: RawSticker[];
}

interface RawSticker {
    number: string;
    name: string;
    position: string;
}

/**
 * JSON-based implementation of TeamRepository.
 * Reads team data from the static teams.json file.
 *
 * RESPONSIBILITY: Map raw JSON data to domain entities.
 * - Derives team ID from array index (teams.json has no id field)
 * - Adds default values for fields not present in JSON (check, quantity)
 *
 * This adapter bridges the gap between the domain interface
 * and the actual data source (JSON file in this case).
 */
export class JsonTeamRepository implements TeamRepository {

    private teams: Team[];

    constructor() {
        this.teams = this.mapTeams();
    }

    async getAll(): Promise<Team[]> {
        return this.teams;
    }

    async getById(id: number): Promise<Team | undefined> {
        return this.teams.find(t => t.id === id);
    }

    async create(sticker: Sticker, id: number): Promise<Team | undefined> {
        const team = this.teams.find(t => t.id === id)
        team?.stickers.push(sticker)
        return team;
    }

    /**
     * Maps raw JSON teams to domain entities.
     * Handles field transformation and defaults.
     */
    private mapTeams(): Team[] {
        const rawTeams = teamsData.teams as unknown as RawTeam[];

        return rawTeams.map((raw, index) => ({
            id: index + 1,  // Derive ID from array position
            name: raw.name,
            stickers: raw.stickers.map(this.mapSticker),
        }));
    }

    /**
     * Maps a raw JSON sticker to a domain Sticker entity.
     * Adds defaults for fields not present in the JSON data.
     */
    private mapSticker(raw: RawSticker): Sticker {
        return {
            number: raw.number,
            name: raw.name,
            position: raw.position,
            check: false,       // Default: not collected yet
            quantity: 0,        // Default: none owned
        };
    }
}
