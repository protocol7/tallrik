﻿var sp = getSpotifyApi(1);

var server = 'http://172.21.113.142:9999/';

var templates = {
  "layout": null,
  "player": null,
  "tuner": null,
  "artists": null
};

var models;
var artists;
var venues;
var recommendedArtists;
var trackToArtists = {}

var tempPlaylist = undefined;
var getNextTrack = function(callback) {
  var sel = $(".artist-selection .ui-selected").data("selection");
  var artistsSel;
  if(sel == "soon" || sel == undefined) {
    var h = 2;
    artistsSel = [];
    while(artistsSel.length < 10) {
      var t = new Date();
      t.setHours(t.getHours() + h);
      artistsSel = getArtistsInTimespan(new Date(), t);
      h++;
    }
  } else if(sel == "all") {
    artistsSel = $.map(artists, function(_, a) { return a; });
  } else if(sel == "thursday") {
    artistsSel = getArtistsInTimespan("2012-08-09 08:00", "2012-08-10 08:00");
  } else if(sel == "friday") {
    artistsSel = getArtistsInTimespan("2012-08-10 08:00", "2012-08-11 08:00");
  } else if(sel == "saturday") {
    artistsSel = getArtistsInTimespan("2012-08-11 08:00", "2012-08-12 08:00");
  } else if(sel == "recommended") {
    var selectedArtists = $.map(recommendedArtists.artists.slice(0, 5), function(a) { return a.name; });
    artistsSel = selectedArtists;
  }
  var artist = artistsSel[Math.floor(Math.random()*artistsSel.length)];
  getTopTrackForArtist(artist, function(tracks) {
    if(tracks.length == 0) {
      getNextTrack(callback);
      return;
    }
    var track = tracks[Math.floor(Math.random()*tracks.length)];
    trackToArtists[track.uri] = artist;
    callback(track);
  });
}

var getNextTracks = function(count, callback) {
  var tracks = [];
  var f;
  f = function() {
    getNextTrack(function(track) {
      tracks.push(track);
      if(tracks.length == count) callback(tracks);
      else f();
    });
  };
  f();
}

var getTopTrackForArtist = function(artistName, callback) {
  var search = new models.Search("artist:" + artistName);
  search.localResults = models.LOCALSEARCHRESULTS.APPEND;
  search.observe(models.EVENT.CHANGE, function() {
    callback(search.tracks);
  });
  search.appendNext();
}

var getFestivalInfo = function(track) {
  var artistName = trackToArtists[track.uri];
  var artist = artists[artistName];
  if(artist == undefined) return undefined;
  return {
    scene: venues[artist.venueID],
    startTime: artist.gig_start,
    endTime: artist.gig_end,
    due: getDueTime(artist.gig_start),
    artist: artist
  }
}

var getArtistsInTimespan = function(startTime, endTime) {
	var start = new Date(startTime);
	var end = new Date(endTime);
	var list = new Array;
	for (var artist in artists) {
		var gigStart = new Date(artists[artist].gig_start);
		if (gigStart > start && gigStart <= end) {
			list.push(artist);
		}
	}
	return list;
}

var loadTuner = function(container) {
  var tuner = $(templates["tuner"].main());
  var dropPlaylistArea = $(".dropper", tuner);
  dropPlaylistArea.bind("dragover", function(e) {
    e.preventDefault();
    $(this).addClass("dragover");
    return false;
  });
  dropPlaylistArea.bind("dragleave", function(e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).removeClass("dragover");
    return false;
  });
  dropPlaylistArea.bind("drop", function(e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).removeClass("dragover");
    // Drop stuff
    var droppedURL = e.originalEvent.dataTransfer.getData("text")

    if(droppedURL.indexOf("playlist") == -1) {
      console.log("Only playlists supported");
      return false;
    }

    models.Playlist.fromURI(droppedURL, function(playlist) {
      var artists = {}
      $.each(playlist.tracks, function(i, track) {
        $.each(track.artists, function(j, artist) {
          artists[artist.name] = 1
        })
      })

      artists = $.map(artists, function(i, a) { return {"name":a} })

      $.ajax({
        url: server + sp.core.user.canonicalUsername,
        data: JSON.stringify({"artists": artists}),
        processData: false,
        contentType: "application/json",
        type: "POST",
        success:function(a) {
          // reload recommended artists
          $.getJSON(server + sp.core.user.canonicalUsername, function(data) {
            recommendedArtists = data;
            loadRecommendedArtists($(".recommended-artists-container", $(".player")))
          })
        },
        error:function() { console.log("Failed to upload favorite artists")}
      });
    });

    return false;
  });
  container.html(tuner);
}

var getDueTime = function(startTime) {
  var currentTime = new Date();
  var msDifference = new Date(startTime) - currentTime;
  var minutesLeft = Math.floor(msDifference / (1000 * 60)); // ms to even minutes

  var returnString = '';
  if (minutesLeft >= 60) {
    var hoursLeft = Math.floor(minutesLeft / 60);
    var minutePart = minutesLeft - hoursLeft * 60;
    returnString = hoursLeft + ' hours ' + (minutePart > 0 ? minutePart + ' minutes' : '');
  } else if (minutesLeft > 0) {
    returnString = minutesLeft + ' minutes';
  }
  else {
    returnString = 'the future. Hopefully.';
  }
  return returnString;
}

var loadNowPlaying = function(container, track) {
  exports.t = container;
  var festivalInfo = getFestivalInfo(track);
  if(festivalInfo == undefined) container.html("Cannot find '" + track.artists[0].name + "' in festival schema");
  else {
    
      var nowPlaying = $(templates["player"].nowPlaying({ 
        artist: trackToArtists[track.uri],
        artistUri: track.artists[0].uri,
        title: track.name,
        scene: festivalInfo.scene, 
        due: festivalInfo.due 
      }));
      
      $.get(festivalInfo.artist.wow_URL, function(data) {
        var d = $(data);
        exports.d = d;
        var img = $(".imagefield", d)[0].src;
        $(".image-container", nowPlaying).html(templates["player"].nowPlayingImage({          
          image: img, 
          image2: track.image,
        }));
      });
      container.empty();
      container.append(nowPlaying);
  }
}

var loadPlayer = function(container) {
  var player = $(templates["player"].player());
  var playerPlaylist = new models.Playlist();
  
  var refreshTracks = function(callback) {
    var ts = playerPlaylist.tracks.map(function(t) { return t.uri; });
    for(var i=0; i < ts.length; i++) {
      if(models.player.track == null || models.player.track.uri != ts[i])
        playerPlaylist.remove(ts[i]);
    }
    getNextTracks(2 - playerPlaylist.length, function(tracks) {
      tracks.forEach(function(track) {
        playerPlaylist.add(track);
      });
      callback();
    });
  }
  
  $(".play-button", player).click(function() {
    models.player.play(playerPlaylist.tracks[0], playerPlaylist);
    return false;
  });
  $(".skip-button", player).click(function() {
    if(models.player.track != undefined)
      models.player.next();
    return false;
  });
  $(".artist-selection ul", player).selectable({
    selected: function() {
      refreshTracks();
    }
  });
      
  container.empty();
  container.append(player);
  getNextTrack(function(track2) {
    playerPlaylist.add(track2);
    getNextTrack(function(track3) { 
      playerPlaylist.add(track3); 
      
      var nowPlayingTrack = playerPlaylist.tracks[0];
      loadNowPlaying($(".now-playing-container", player), playerPlaylist.tracks[0]);
      loadTuner($(".tuner-container", player));
      models.player.observe(models.EVENT.CHANGE, function(event) {
        refreshTracks(function() {
        
          if(models.player.track != undefined && models.player.track.uri == nowPlayingTrack.uri) return;
          nowPlayingTrack = models.player.track;
          loadNowPlaying($(".now-playing-container", player), models.player.track);
        });
      });
      
      });
  });
  
  $.getJSON(server + sp.core.user.canonicalUsername, function(data) {
    recommendedArtists = data;
    loadRecommendedArtists($(".recommended-artists-container", player));
  }).error(function(e) {
	console.log("Error: ");
	console.dir(e);
  });
}

var loadRecommendedArtists = function(container) {
  if(recommendedArtists == undefined) return;
  var recArtistsNames = recommendedArtists.artists.slice(0, 5)
  var html = $(templates["artists"].artists({"artists": recArtistsNames}));

  $.each(recArtistsNames, function(index, artist) {
      var div = $("div:nth-child(" + (index + 1) + ")", html)

      var search = new models.Search("artist:" + artist.name, {"pageSize": 1, "searchAlbums": false, "searchTracks": false, "searchPlaylists": false})
      search.observe(models.EVENT.CHANGE, function() {
        search.artists.forEach(function(a) {
          $(".rec-artist-name", div).text(a.data.name)
          $("img", div).css("background-image", "url(" + a.data.portrait + ")")
          $(div).click(function() {
            window.location = a.data.uri
          })
        });
      });
      search.appendNext();
  })

  container.html(html)
}

exports.init = function () {

  sp.require("scripts/jquery-1.7.2.min");
  sp.require("scripts/jquery-ui-1.8.21.custom.min");
  sp.require("scripts/less-1.3.0.min");
  var slab = sp.require("scripts/slab").slab;
  models = sp.require('sp://import/scripts/api/models');
  exports.models = models;
  
  $(function() {
  
    var t = templates;
    templates = {};
	
    var defs = $.map(t, function(_, k) { return $.get("templates/" + k + ".slab", function(data) { templates[k] = slab.compile(data); }) });
	defs.push($.get('http://apps.wayoutwest.se/wow-phone-app/2012/desktop/artists.php', function(data) {
      artists = {};
      $.map(data, function(a, _) {
        artists[a.title.toLowerCase()] = a;
      });
    }).error(function() { alert("Error loading artist data."); }));
    defs.push($.get('http://apps.wayoutwest.se/wow-phone-app/2012/desktop/venues.php', function(data) {
      venues = new Array;
      $.map(data.result, function(v, _) {
        venues[v.ID] = v.title;
      });
    }).error(function() { alert("Error loading venue data."); }));

    $.when.apply($, defs).done(function() {
      console.log("Loading layout");
      var layout = $(templates["layout"].main());
      $("body").append(layout);
      //models.player.play(playlist.tracks[0]);
      
      loadPlayer($(".player-container", layout));
	  

    });
  });
}