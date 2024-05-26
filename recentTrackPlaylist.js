(function playlistFromRecentlyPlayedTracks() {
  const {
    CosmosAsync,

    URI,
  } = Spicetify;
  if (!(CosmosAsync && URI)) {
    setTimeout(playlistFromRecentlyPlayedTracks, 300);
    return;
  }

  const MAX_RECENT_TRACKS_REQUESTABLE = 50; // Spotify Get Recently Played API max tracks per request (https://developer.spotify.com/documentation/web-api/reference/get-recently-played)
  const API_DELAY = 5000; // Artificial delay in milliseconds between API calls

  const buttontxt = "Make playlist from recently played tracks";

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

  function shouldDisplayContextMenu(uris) {
    if (uris.length > 1) {
      return false;
    }

    const uri = uris[0];
    const uriObj = Spicetify.URI.fromString(uri);

    if (
      uriObj.type === Spicetify.URI.Type.PLAYLIST_V2 ||
      uriObj.type === Spicetify.URI.Type.TRACK
    ) {
      return true;
    }

    return false;
  }

  const cntxMenu = new Spicetify.ContextMenu.Item(
    buttontxt,
    compileHistoryPlaylist,
    shouldDisplayContextMenu
  );

  cntxMenu.register();
})();
