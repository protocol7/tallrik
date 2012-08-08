Code from our #wowhack

Score service API
-----------------
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


Schedule hack
-------------
Run a web server, e.g. `python -m SimpleHTTPServer` in the schedule directory
