(function playlistFromRecentlyPlayedTracks() {
  const { Platform, CosmosAsync } = Spicetify;
  if (!(Platform && CosmosAsync)) {
    setTimeout(playlistFromRecentlyPlayedTracks, 300);
    return;
  }
  // Icon - 'Activity Log Icon' from https://uxwing.com/activity-log-icon/
  const CONVERT_ICON = `
  <?xml version="1.0" encoding="utf-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 323 512.53">
  <path fill-rule="nonzero" d="M175.75 137.25c-8.53-1.25-17.91-1.5-26.38-1.5-8.47 0-16.63 2.5-24.47 7.05-7.83 4.55-10.53 11.35-10.53 18.35 0 8.53 2.53 16.62 7.05 24.47 4.53 7.83 11.25 10.52 11.25 18.35 0 8.53-2.53 16.62-7.05 24.47-4.53 7.83-11.25 10.52-11.25 18.35zm-11.17 15.5c-6.47-1.25-11.47-1.5-16.22-1.5-8.53 0-16.63 2.5-24.47 7.05-7.83 4.55-10.53 11.35-10.53 18.35 0 8.53 2.53 16.62 7.05 24.47 4.53 7.83 11.25 10.52 11.25 18.35z"/>
  </svg>
 `;
  new Spicetify.Topbar.Button(
    "Playlist from Recently Played Tracks",
    CONVERT_ICON,
    compileHistoryPlaylist,
    false
  );

  const MAX_RECENT_TRACKS_REQUESTABLE = 50; // Spotify Get Recently Played API max tracks per request (https://developer.spotify.com/documentation/web-api/reference/get-recently-played)
  const API_DELAY = 5000; // Artificial delay in milliseconds between API calls

  async function compileHistoryPlaylist() {
    // Definitions

    const timeStamp = new Date().getTime(); // Current time as a unicode timestamp
    const outputTimeStamp = new Date(timeStamp).toLocaleString(); // Output time as date and time

    async function getRecentlyPlayedTrackURIs() {
      const numberOfRecentlyPlayedTracks = MAX_RECENT_TRACKS_REQUESTABLE;
      const requestURL = `https://api.spotify.com/v1/me/player/recently-played`;

      const response = await CosmosAsync.get(requestURL, {
        limit: numberOfRecentlyPlayedTracks,
        before: timeStamp,
      });

      if (!response) {
        throw new Error("Failed to get recently played tracks");
      }

      let recentlyPlayedTracks = response.items;

      console.log("Recently played tracks:", response);

      const recentlyPlayedTrackURIs = recentlyPlayedTracks.map(
        (recentlyPlayedTrack) => recentlyPlayedTrack.track.uri
      );
      return recentlyPlayedTrackURIs;
    }

    async function createEmptyPlaylist() {
      const response = await CosmosAsync.post(
        "https://api.spotify.com/v1/me/playlists",
        {
          name: `Recently Played Tracks (${outputTimeStamp})`,
          public: true,
          description:
            "Created with Spicetify Playlist from Recently Played Tracks",
        }
      );
      if (!response) {
        throw new Error("Failed to create empty playlist");
      }
      console.log("Playlist created:", response);
      return response;
    }

    async function addRecentTracksToPlaylist() {
      let recentlyPlayedTrackURIs = await getRecentlyPlayedTrackURIs();

      const historyPlaylist = await createEmptyPlaylist();
      const historyPlaylistHREF = historyPlaylist.href;
      const requestURL = `${historyPlaylistHREF}/tracks`; // i.e. https://api.spotify.com/v1/playlists/{playlist_id}/tracks

      const requestBody = { uris: recentlyPlayedTrackURIs };

      const response = await CosmosAsync.post(requestURL, requestBody);
      if (!response) {
        throw new Error("Failed to add tracks to playlist");
      }
      console.log("Added tracks to playlist:", response);

      return response;
    }

    // Execution
    Spicetify.showNotification(
      "Making recently played tracks playlist (wait ~5 seconds)..."
    );
    await new Promise((resolve) => setTimeout(resolve, API_DELAY));

    addRecentTracksToPlaylist()
      .then(() => {
        Spicetify.showNotification("Made recently played tracks playlist");
      })
      .catch((error) => {
        console.error(error);
        Spicetify.showNotification(
          "Failed to make recently played tracks playlist"
        );
      });
  }
})();
