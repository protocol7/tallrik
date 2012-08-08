Code from our #wowhack

Spotify app
-----------

You need to a Spotify app developer to load the app locally. If you are,
softlink the tallrik-app directory to your ~/Spotify or ~/My documents/Spotify
and open the app in Spotify using the URI `spotify:app:tallrik`.

For full functionality it needs the score service running on localhost. See
below for details.

Score service
-------------
* Get recommended WoW artists for the user
  `HTTP GET /<username>`
  Returns 200 and a scored list of WoW artists:
  `{"artists": [
    {"name": "Refused", "score": 123}
  ]}`

* Add user favorite artists
  `HTTP POST /<username>`
  Data:
  `{"artists": [
      {"name": "Refused"}
    ]
  }`
  Returns 200 on success

* Delete all the users favorites
  `HTTP DELETE /<username>`
  Returns 200 on success

Build using `mvn package` and run directly from the generated JAR file:
`java -jar target/tallrik-1.0-SNAPSHOT.jar`

Will start an HTTP server listening on port 9999.

Schedule hack
-------------
Run a web server, e.g. `python -m SimpleHTTPServer` in the schedule directory
