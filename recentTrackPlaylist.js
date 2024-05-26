(function playlistFromRecentlyPlayedTracks() {
  const { Platform, CosmosAsync } = Spicetify;
  if (!(Platform && CosmosAsync)) {
    setTimeout(playlistFromRecentlyPlayedTracks, 300);
    return;
  }
  // Icon - 'Activity Log Icon' from https://uxwing.com/activity-log-icon/
  const CONVERT_ICON = `
  <?xml version="1.0" encoding="utf-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" fill="var(--spice-text)" height="24" viewBox="0 0 24 24" width="24" transform='scale(1.15)'>
  <path fill-rule='nonzero' d="M3.58 5.25h7.76c.66 0 .66 1.11 0 1.11H3.58c-.66 0-.66-1.11 0-1.11zm5.71 11.41c.37-.06.65.31.53.65-.07.18-.22.31-.41.33-.44.05-.88.07-1.32.04-1.62-.13-3.07-.81-4.14-1.88-1.17-1.17-1.88-2.78-1.88-4.56 0-1.78.71-3.4 1.88-4.56 1.17-1.17 2.78-1.88 4.56-1.88.71 0 1.4.1 2.07.27.55.18 1.07.42 1.56.72l-.14-.37c-.1-.3.03-.63.33-.74.29-.12.63.03.74.33l.57 1.49c.02.07.03.12.03.18.05.28-.1.55-.39.64l-1.64.51c-.29.1-.6-.09-.69-.39-.1-.29.09-.6.39-.69l.14-.04c-.33-.18-.68-.32-1.05-.43-.47-.13-.98-.21-1.52-.21-1.52 0-2.9.61-3.89 1.6-1 1-1.6 2.37-1.6 3.89 0 1.52.61 2.9 1.6 3.89.84.84 2.04 1.33 3.33 1.43.38.03.7.02 1.05-.04zm-1.31-9.11c0-.27.22-.48.48-.48.27 0 .48.21.48.48v2.9l2.43 1.07c.29.12.42.57.3.86-.13.29-.57.42-.86.3L7.8 11.6c-.19-.07-.32-.32-.32-.57v-3.48zm3.56 7.73c-.36.18-.29.88.07 1.02.1.03.23.02.33-.04.29-.15.57-.31.83-.5.13-.1.21-.25.19-.42-.04-.36-.44-.55-.74-.32-.36.23-.71.43-1.15.75zm1.88-1.81c-.2.36.03.82.45.81.17-.01.34-.1.45-.23.24-.36.39-.74.55-1.14.15-.39-.09-.82-.46-.84-.21-.01-.4.11-.49.32-.13.31-.24.65-.4.94zm.8-3.04c-.02.18.08.35.26.43.33.18.73-.02.81-.4.04-.37.04-.73.02-1.1-.01-.18-.12-.34-.28-.41-.36-.18-.79.09-.76.49.02.29.02.58-.02.87zm-.42-2.42c.1.23.36.34.59.23.22-.1.32-.35.23-.56a7.22 7.22 0 00-.49-.9c-.24-.45-.67-.33-.78.18-.02.12 0 .23.06.34.17.27.32.56.39.88zM11.63 2.22l3.65 3.42h-3.65V2.22zM15 6.49c0-.25-.16-.53-.46-.83L10.34.22c-.11-.13-.31-.22-.51-.22H1.2c-.44 0-.8.36-.8.8v15.73c.27-.74.61-1.43 1.02-2.06V1.33h8.85v5.08c0 .34.27.61.61.61h5.05v6.76c.59.49.94 1.27 1.26 1.97V6.49zM3.58 5.1h3.31c.66 0 .66 1.11 0 1.11H3.58c-.66 0-.66-1.11 0-1.11z"/>
  fill="var(--spice-text)</svg>
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
