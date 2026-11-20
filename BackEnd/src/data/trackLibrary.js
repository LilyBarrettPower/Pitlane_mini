// Built-in library of tracks, grouped by country. Teams pick from these
// (which copies the track into their organisation) or add their own.
//
// Lengths are from Wikipedia, Motorsport NZ and Toyota NZ track guides
// (checked Nov 2026). Where sources disagreed the most commonly quoted figure
// is used - teams can edit lengths on their own copy in Settings > Tracks.
//
// To add a country: add another entry keyed by its ISO code (e.g. "AU").
// `key` must be unique and never change - it links a team's copy to the library.

const TRACK_LIBRARY = {
    NZ: {
        countryName: "New Zealand",
        tracks: [
            { key: "nz-hampton-downs-international", name: "Hampton Downs - International", city: "Hampton Downs", distanceKms: 3.8 },
            // Motorsport NZ: 2.63 km, Wikipedia: 2.70 km
            { key: "nz-hampton-downs-national", name: "Hampton Downs - National", city: "Hampton Downs", distanceKms: 2.63 },
            { key: "nz-hampton-downs-club", name: "Hampton Downs - Club", city: "Hampton Downs", distanceKms: 1.2 },
            { key: "nz-taupo-international", name: "Taupō - International (Circuit 1)", city: "Taupō", distanceKms: 3.32 },
            { key: "nz-taupo-circuit-2", name: "Taupō - Circuit 2", city: "Taupō", distanceKms: 2.2 },
            { key: "nz-manfeild-chris-amon", name: "Manfeild - Circuit Chris Amon", city: "Feilding", distanceKms: 3.03 },
            { key: "nz-manfeild-full", name: "Manfeild - Full Circuit", city: "Feilding", distanceKms: 4.51 },
            { key: "nz-ruapuna-grand-prix", name: "Ruapuna (Euromarque Motorsport Park) - Grand Prix", city: "Christchurch", distanceKms: 3.33 },
            { key: "nz-levels", name: "Levels Raceway", city: "Timaru", distanceKms: 2.4 },
            // Wikipedia: 2.57 km, Motorsport NZ: 2.62 km
            { key: "nz-teretonga", name: "Teretonga Park", city: "Invercargill", distanceKms: 2.57 },
            // Most sources: 4.1 km, Motorsport NZ: 4.0 km
            { key: "nz-highlands", name: "Highlands Motorsport Park", city: "Cromwell", distanceKms: 4.1 },
        ],
    },
};

function findLibraryTrack(key) {
    for (const [countryCode, country] of Object.entries(TRACK_LIBRARY)) {
        const track = country.tracks.find((item) => item.key === key);
        if (track) return { ...track, countryCode, country: country.countryName };
    }
    return null;
}

module.exports = { TRACK_LIBRARY, findLibraryTrack };
