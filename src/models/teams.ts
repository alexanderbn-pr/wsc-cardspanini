import teams from "@/data/teams.json" with { type: "json" };

export class TeamsModel {
    static async getAll() {
        return teams.teams;
    }
    static async getById(id: number) {
        return teams.teams.find(t => t.id === id);
    }
    static async getStickersByTeamId(id: number, position?: string, limit?: number, offset?: number) {
        const team = await TeamsModel.getById(Number(id));
        let stickers = team?.stickers;
        if (position) {
            stickers = stickers?.filter(s => s.position.toLocaleLowerCase() === position.toString().toLocaleLowerCase());
        }
        const limitNumber = Number(limit);
        const offsetNumber = Number(offset);
        stickers = stickers?.slice(offsetNumber, offsetNumber + limitNumber);
        return stickers;
    }
}