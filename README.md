Code from our #wowhack


Score service API
* HTTP GET /<username>
  Returns 200 and a scored list of WoW artists:
  {"artists": [
    {"name": "Refused", "score": 123}
  ]}

* HTTP POST /<username>/<artist name>/<score type>
  Returns 200
