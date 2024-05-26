# Spicetify Playlist from Recently Played Tracks

Spicetify extension that creates a playlist of the user's 50 most recently played tracks per the Spotify Web API's Get Recently Played Tracks endpoint (https://developer.spotify.com/documentation/web-api/reference/get-recently-played). One-click button that sits on the top bar.

Icon used is "Activity Log Icon" from UXWing: https://uxwing.com/activity-log-icon/

![sample](/sample1.png)
![sample](/sample2.png)

## Manual Installation

1. Install Spicetify: [https://spicetify.app/docs/installation](https://spicetify.app/docs/installation)
2. Download recentTrackPlaylist.js and put it in the Spicetify Extensions folder (https://spicetify.app/docs/advanced-usage/extensions)
3. Open a terminal and run: spicetify config extensions recentTrackPlaylist.js
4. In the terminal, run: spicetify apply

## Updating

1. Download the new version of recentTrackPlaylist.js and put it in the Spicetify Extensions folder, overwriting the old version
2. Open a terminal and run: spicetify apply

## Manual Uninstallation

1. Open a terminal and run: spicetify config extensions recentTrackPlaylist.js-
2. In the terminal, run: spicetify apply
3. Delete recentTrackPlaylist.js from the Spicetify Extensions folder (if not deleted it will still no longer load in Spicetify at this point)

## Usage

Click the icon and a notification should appear to indicate that the script has started. After completion, another notification will appear indicating success or failure.

There is an artificial delay of five seconds to limit API calls, so running should take about five seconds.

The recently played tracks are per the Web API endpoint linked above. The results seem to differ from both the list you can see in the Spotify desktop app and the one on mobile, which both seem to differ from each other as well...